
import fs from 'fs';
import {
    describe,
    test,
    expect,
    beforeEach,
    jest
} from '@jest/globals'
import { pipeline } from 'stream/promises';
import { resolve } from 'path';
import faker from 'faker';

import UploadHandler from '../../src/uploadHandler.js'
import TestUtil from '../_util/testUtil.js';
import { logger } from '../../src/logger.js';

describe('#UploadHandler', () => {
    const socketId = faker.datatype.uuid();
    const io = {
        to: (id) => io,
        emit: (event, message) => { }
    }

    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation();
    })

    describe('#registerEvents', () => {

        test('should call onFile and onFinish functions on BusBoy instance', () => {
            const uploadHandler = new UploadHandler({ io, socketId });

            jest.spyOn(uploadHandler, uploadHandler.onFile.name)
                .mockResolvedValue();

            const headers = {
                'content-type': 'multipart/form-data; boundary='
            }

            const onFinish = jest.fn();

            const busboyInstance = uploadHandler.registerEvents(headers, onFinish);

            const readableStream = TestUtil.generateReadableStream([ 'chunk', 'of', 'data' ]);

            busboyInstance.emit('file', 'fieldname', readableStream, 'filename.txt');

            busboyInstance.listeners('finish').forEach(listener => listener.call());

            expect(uploadHandler.onFile).toHaveBeenCalled();
            expect(onFinish).toHaveBeenCalled();
        });
    })

    describe('#onFline', () => {
        test('should save file on disk from a stream', async () => {
            const chunks = [ 'hey', 'dude' ];
            const downloadsFolder = '/tmp';
            const uploadHandler = new UploadHandler({ io, socketId, downloadsFolder });

            const onData = jest.fn();

            jest.spyOn(fs, fs.createWriteStream.name)
                .mockImplementation(() => TestUtil.generateWritableStream(onData));

            const onTransform = jest.fn();
            jest.spyOn(uploadHandler, uploadHandler.onData.name)
                .mockImplementation(() => TestUtil.generateTransformStream(onTransform));

            const params = {
                fieldname: 'video',
                file: TestUtil.generateReadableStream(chunks),
                filename: 'mockFile.txt'
            };

            await uploadHandler.onFile(...Object.values(params));

            expect(onData.mock.calls.join()).toEqual(chunks.join());
            expect(onTransform.mock.calls.join()).toEqual(chunks.join());

            const expectedFilename = resolve(uploadHandler.downloadsFolder, params.filename)
            expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename);
        })
    })

    describe('#onData', () => {
        test('should emit whem call transform stream', async () => {
            jest.spyOn(io, io.to.name);
            jest.spyOn(io, io.emit.name);

            const uploadHandler = new UploadHandler({ io, socketId });

            const chunks = [ 'hello' ];
            const source = TestUtil.generateReadableStream(chunks);
            const onWrite = jest.fn();
            const target = TestUtil.generateWritableStream(onWrite);

            await pipeline(
                source,
                uploadHandler.onData('filename.txt'),
                target
            );

            expect(io.to).toHaveBeenCalledTimes(chunks.length);
            expect(io.emit).toHaveBeenCalledTimes(chunks.length);
            // Verificando se o transform stream está chamado o método de gravação de arquivo
            expect(onWrite).toHaveBeenCalledTimes(chunks.length);
            expect(onWrite.mock.calls.join()).toEqual(chunks.join());
        });
    })
})