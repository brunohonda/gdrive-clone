export default class ViewManager {

    constructor(targetElementId) {
        this.fileTable = document.getElementById('file-table');
        // this.btnNewFile = document.getElementById('btn-new-file');

        // this.btnNewFile.on('click', this.uploadFile.bind(this));

        this.formatter = Intl.DateTimeFormat('pt', {
            locale: 'pt-br',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    getIcon(file) {
        if (file.match(/\.mp4/i)) {
            return 'movie'
        }

        if (file.match(/\.((jp)|(png))/i)) {
            return 'image'
        }

        return 'content_copy';
    }

    makeIcon(file) {
        const icon = this.getIcon(file);
        const colors = {
            image: 'yellow600',
            movie: 'red600',
            file: ''
        }

        return `<i class="material-icons ${colors[icon]} left">${icon}</i>`
    }

    updateCurrentFiles(files) {
        const template = (item) => `
        <tr>
            <td>${ this.makeIcon(item.file) } ${ item.file }</td>
            <td>${ item.owner }</td>
            <td>${ this.formatter.format(new Date(item.lastModified)) }</td>
            <td>${ item.size }</td>
        </tr>
        `;

        this.fileTable.innerHTML = files.map(template).join('');
    }
}