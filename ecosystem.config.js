module.exports = {
    apps: [
        {
            name: "downloader-web",
            script: "npm",
            args: "start",
            env: {
                NODE_ENV: "production",
                PORT: 3000
            }
        },
        {
            name: "downloader-worker",
            script: "npx",
            args: "tsx worker.ts",
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};
