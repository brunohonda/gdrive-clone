import { read } from 'fs';
import { Readable } from 'stream';

export default class TestUtil {
    static generateReadableStream(data) {
        return new Readable({
            objectMode: true,                   // Para trazer o retorno de cada chunck como string ao invés de Buffer
            async read() {
                for(const item of data) {
                    this.push(item);
                }

                this.push(null);
            }
        });
    }
}