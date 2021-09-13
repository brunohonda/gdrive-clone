export default class DragAndDropManager {
    constructor() {
        this.dropArea = document.getElementById('drop-area');
        this.onDropHandler = () => {};
    }

    initialize({ onDrop }) {
        this.onDropHandler = onDrop;

        this.disableDragAndDropEvents();
        this.enableHighlightOnDrag();
        this.enableDrop();
    }

    disableDragAndDropEvents() {
        const events = [
            'dragenter',
            'dragover',
            'dragleave',
            'drop',
        ];

        const preventDefaults = (event) => {
            event.preventDefault();
            event.stopPropagation();
        };

        events.forEach(event => {
            this.dropArea.addEventListener(event, preventDefaults, false)
            document.body.addEventListener(event, preventDefaults, false)
        });
    }

    enableHighlightOnDrag() {
        const events = [
            'dragenter',
            'dragover',
        ];

        const highlight = (event) => {
            this.dropArea.classList.add('highlight');
            this.dropArea.classList.add('drop-area');
        };

        events.forEach(event => {
            this.dropArea.addEventListener(event, highlight, false)
        });


        const lowlight = (event) => {
            this.dropArea.classList.remove('highlight');
            this.dropArea.classList.remove('drop-area');
        };

        events.forEach(event => {
            this.dropArea.addEventListener('dragleave', lowlight, false)
        });
    }

    enableDrop(event) {
        const drop = (event) => {
            this.dropArea.classList.remove('drop-area');

            const files = event.dataTransfer.files;
            return this.onDropHandler(files);
        }

        this.dropArea.addEventListener('drop', drop, false);
    }
}