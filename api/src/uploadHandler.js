import fs from 'fs';
import { pipeline } from 'stream/promises';
import Busboy from 'busboy';
import { logger } from './logger';

export default class UploadHandler {
    constructor({ io, socketId, downloadsFolder }) {
        this.io = io;
        this.socketId = socketId;
        this.downloadsFolder = downloadsFolder;
        this.ON_UPLOAD_EVENT = 'file-upload';
    }

    onData(filename) {
        async function* handleData(source) {
            let processedAlready = 0;

            for await(const chunk of source) {
                yield chunk;
                processedAlready += chunk.length;

                this.io.to(this.socketId)
                    .emit(this.ON_UPLOAD_EVENT, { processedAlready, filename });
                
                logger.info(`File [${filename}] got ${processedAlready} bytes to ${this.socketId}`);
            }
        }

        return handleData.bind(this);
    }

    async onFile(fieldName, file, filename) {
        const saveTo = `${this.downloadsFolder}/${filename}`;

        await pipeline(
            file,
            this.onData.apply(this, [ filename]),
            fs.createWriteStream(saveTo)
        );
        
        logger.info(`File [${filename}] finished`);
    }

    registerEvents(headers, onFinish) {
        const busboy = new Busboy({ headers });

        busboy.on('file', this.onFile.bind(this));
        busboy.on('finish', onFinish);

        return busboy;
    }
}