export default class ViewManager {

    constructor(targetElementId) {
        this.targetElement = document.getElementById(targetElementId);
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
            <td>${this.makeIcon(item.file)} ${item.file}</td>
            <td>${item.owner}</td>
            <td>${new Date(item.lastModified).toLocaleString()}</td>
            <td>${item.size}</td>
        </tr>
        `;

        this.targetElement.innerHTML = files.map(template).join('');
    }
}