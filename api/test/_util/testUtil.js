import { Readable, Transform, Writable } from 'stream';
import { jest } from '@jest/globals';

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

    static getTimeFromDate(dateString) {
        return new Date(dateString).getTime();
    }

    static mockDateNow(mockImplementationPeriods) {
        const now = jest.spyOn(global.Date, global.Date.now.name);

        mockImplementationPeriods.forEach(time => {
            now.mockReturnValueOnce(time)
        })
    }
}