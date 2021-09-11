import { Readable, Transform, Writable } from 'stream';

export default class TestUtil {
    static generateReadableStream(data) {
        return new Readable({
            objectMode: true,                   // Para trazer o retorno de cada chunk como string ao invés de Buffer
            read() {
                for(const item of data) {
                    this.push(item);
                }

                this.push(null);
            }
        });
    }

    static generateWritableStream(fn) {
        return new Writable({
            objectMode: true,                   // Para trazer o retorno de cada chunk como string ao invés de Buffer
            write(chunk, encoding, cb) {
                fn(chunk);
                cb(null, chunk);
            }
        });
    }

    static generateTransformStream(fn) {
        return new Transform({
            objectMode: true,
            transform(chunk, encoding, cb) {
                fn(chunk);
                cb(null, chunk);
            }
        })
    }
}