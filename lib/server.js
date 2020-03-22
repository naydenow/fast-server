const chokidar = require('chokidar');
const path = require('path');
const Promise = require('bluebird');
const glob = Promise.promisify(require('glob'));
const $ = require('fast.js');
const Joi = require('joi');
const uws = require('uWebSockets.js')
const noop = () => { }

require('./exceptions');

module.exports = class {
    constructor(options = {}) {
        this._options = options;
        this.Joi = Joi;
        this._routes = {};
        this._watchers = {};
        this._server = uws.App({}).any('/*', (res, req) => this.handleRequest(res, req));
        this._fileLink = {};

    }

    handleRequest(res, req) {
        const url = req.getUrl().substr(1);
        const method = req.getMethod().toUpperCase();

        let route = url.replace(/\//g, '-');
        let version = 1;
        let parsedRouteName = route.match(/^v(.*?)-(.*)/);

        res.onAborted(err => console.error(err));

        if (parsedRouteName !== null) {
            version = +parsedRouteName[1];
            route = parsedRouteName[2];
        }

        // Route Not Found
        if (this._routes[route] === undefined) {
            const NFError = new NotFound();

            res.writeStatus(NFError.statusCode.toString());
            res.writeHeader('content-type', 'application/json; charset=utf-8');

            return res.end(JSON.stringify(NFError));
        }

        const maxVersion = Math.max(...Object.keys(this._routes[route]));
        const handler = this._routes[route][version > maxVersion ? maxVersion : version];

        // Method not supported
        if (handler === undefined || !(handler.method || []).includes(method)) {
            const NFError = new NotFound();

            res.writeStatus(NFError.statusCode.toString());
            res.writeHeader('content-type', 'application/json; charset=utf-8');

            return res.end(JSON.stringify(NFError));
        }

        return Promise.resolve(handler.call(this, res, req))
            .then(result => {
                if (typeof result !== 'string')
                    result = JSON.stringify(result);

                res.end(result);
            }).catch(error => {
                const SUError = new ServiceUnavailable(error);

                res.writeStatus(SUError.statusCode.toString());
                res.writeHeader('content-type', 'application/json; charset=utf-8');

                return res.end(JSON.stringify(SUError));
            })
    }

    async softExit() {
        console.log('Start closing');
        uws.us_listen_socket_close(this.socket);
        this.watcher && this.watcher.close().then(() => console.log('Chokidar closed'));
    }

    async init(fn = noop) {
        await this.initRouts();
        await this.startWatchers();

        await fn();

        this._server.listen(this._options.port, (socket) => {
            this.socket = socket;

            if (socket) {
                console.log('Listening to port ' + this._options.port);
            }
            else {
                console.log('Failed to listen to port ' + this._options.port);
            }
        })
    }

    async initRouts() {
        const routPath = this._options.route_path;
        const p = path.join(__dirname, `./../${routPath}`, '**/*.js');
        const routeList = await glob(p);

        for (let route of routeList) {
            this.initRoute(route);
        }
    }

    removeRoute(route) {
        if (this._fileLink[route] === false)
            return;

        delete this._routes[this._fileLink[route].routeName][this._fileLink[route].version];
        delete this._fileLink[route];

    }

    async initRoute(route) {
        let routeHandler = require(route);
        let routeName;

        if (routeHandler.alias) {
            routeName = routeHandler.alias.toString()
        } else {
            routeName = path.basename(route);
        }

        let parsedRouteName = routeName.match(/^v(.*?)-(.*)/);
        let version = 1;

        if (parsedRouteName !== null) {
            version = +parsedRouteName[1];
            routeName = parsedRouteName[2];
        }

        routeName = routeName.replace(/\.(.*)$/, '');

        if (this._routes[routeName] === undefined)
            this._routes[routeName] = {};

        this._routes[routeName][version] = routeHandler;

        this._fileLink[route] = {
            routeName,
            version
        }


        delete require.cache[route];

        console.log('Route inited ', route, version)
    }

    async startWatchers() {
        if (this._options.dev !== true) {
            return
        }

        const routPath = this._options.route_path;
        const p = path.join(__dirname, `./../${routPath}`);

        this.watcher = chokidar.watch(p, {
            ignored: /(^|[\/\\])\../,
            persistent: true,
        });

        this.watcher
            .on('add', path => this.initRoute(path))
            .on('change', path => this.initRoute(path))
            .on('unlink', path => this.removeRoute(path));
    }
}