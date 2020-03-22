const Server = require('./lib/server');

(async () => {
    const server = new Server({
        route_path: './app/routes',
        project_name: 'example',
        port: 8088,
        dev: true
    });

    await server.init(() => {
        server.App = {};
    });
})()