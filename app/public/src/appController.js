export default class AppController {
    constructor({ connectionManager, viewManager }) {
        this.connectionManager = connectionManager;
        this.viewManager = viewManager;

        this.uploadFiles = new Map();
    }

    async initialize() {
        this.viewManager.configureFileButtonClick();
        this.viewManager.configureModal();
        this.viewManager.configureOnFileChange(this.onFileChange.bind(this));
        this.connectionManager.configureEvents({ onProgress: this.onProgress.bind(this) });

        this.viewManager.updateStatus(0);

        await this.updateCurrentFiles();
    }

    async onFileChange(files) {
        this.viewManager.openModal();
        this.viewManager.updateStatus(0);

        const requests = [];

        for(const file of files) {
            this.uploadFiles.set(file.name, file);
            requests.push(
                this.connectionManager.uploadFile(file)
            );
        }

        await Promise.all(requests);

        this.viewManager.updateStatus(100);

        setTimeout(() => {
            this.viewManager.closeModal();
            this.uploadFiles.clear();
        }, 1000);

        await this.updateCurrentFiles();
    }

    async updateCurrentFiles() {
        const files = await this.connectionManager.currentFiles();
        this.viewManager.updateCurrentFiles(files);
    }

    async onProgress({ processedAlready, filename }) {
        const file = this.uploadFiles.get(filename);
        const progress = Math.ceil((processedAlready / file.size) * 100);

        this.updateProgress(file, progress);
        
        if (progress < 98) return;

        return this.updateCurrentFiles();
    }

    updateProgress(file, progress) {
        const uploadingFiles = this.uploadFiles;
        file.progress = progress;

        const total = [ ...uploadingFiles.values() ]
            .map(({ progress }) => progress ?? 0)
            .reduce((total, current) => total + current, 0);

        this.viewManager.updateStatus(total / uploadingFiles.size);
    }
}