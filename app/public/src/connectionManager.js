export default class ConnectionManager {
    constructor({ apiUrl }) {
        this.apiUrl = apiUrl;
        this.ioClient = io.connect(this.apiUrl, { withCredentials: false });
        this.socketId = '';
    }

    configureEvents({ onProgress }) {
        this.ioClient.on('connect', this.onConnect.bind(this));
        this.ioClient.on('file-upload', onProgress);
    }

    onConnect(message) {
        this.socketId = this.ioClient.id;
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('files', file);

        const response = await fetch(`${this.apiUrl}?socketId=${this.socketId}`, {
            method: 'POST',
            body: formData
        });

        return response.json
    }

    async currentFiles() {
        return await (await fetch(this.apiUrl)).json();
    }
}