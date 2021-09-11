
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
        test('should emit notification whem call transform stream', async () => {
            jest.spyOn(io, io.to.name);
            jest.spyOn(io, io.emit.name);

            const uploadHandler = new UploadHandler({ io, socketId });

            jest.spyOn(uploadHandler, uploadHandler.canEmitNotification.name)
                .mockReturnValueOnce(true);

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

        test('dont should emit notification only twice times because the second notification early', async () => {
            const messageTimeDelay = 2000;
            const chunks = [ 'hello', 'wonderful', 'world' ];
            const source = TestUtil.generateReadableStream(chunks);
            const uploadHandler = new UploadHandler({ io, socketId, messageTimeDelay });
            const expectedNotificationSent = 2;
            const expectedProcessAlready = [
                chunks[0].length,
                chunks.join('').length,
            ];
            const filename = 'filename.txt';
            const day = '2021-09-11 00:00';
            
            TestUtil.mockDateNow([
                TestUtil.getTimeFromDate(`${day}:00`),  // On uploadHandler create
                TestUtil.getTimeFromDate(`${day}:02`),  // On received first chunk
                TestUtil.getTimeFromDate(`${day}:02`),  // Update last notification
                TestUtil.getTimeFromDate(`${day}:03`),  // On received second chunck
                TestUtil.getTimeFromDate(`${day}:04`),  // On received third chunk
                TestUtil.getTimeFromDate(`${day}:04`),  // Update last notification
            ])

            jest.spyOn(io, io.emit.name);

            await pipeline(
                source,
                uploadHandler.onData(filename)
            );

            expect(io.emit).toHaveBeenCalledTimes(expectedNotificationSent);
            io.emit.mock.calls.forEach((call, index) => {
                expect(call).toEqual([
                    uploadHandler.ON_UPLOAD_EVENT,
                    {
                        processedAlready: expectedProcessAlready[index],
                        filename
                    }
                ])
            })
        });
    })

    describe('#canEmitNotification', () => {
        test('should return true when time is later than specified delay', () => {
            const lastNotification = TestUtil.getTimeFromDate('2021-09-11 12:00:00');
            const now = TestUtil.getTimeFromDate('2021-09-11 12:00:01');
            const messageTimeDelay = 1000;

            const uploadHandler = new UploadHandler({
                messageTimeDelay
            });

            TestUtil.mockDateNow([ now ]);

            expect(uploadHandler.canEmitNotification(lastNotification)).toBeTruthy();
        });

        test('should return false when time is early than specified delay', () => {
            const lastNotification = TestUtil.getTimeFromDate('2021-09-11 12:00:00');
            const now = TestUtil.getTimeFromDate('2021-09-11 12:00:01');
            const messageTimeDelay = 3000;

            const uploadHandler = new UploadHandler({
                messageTimeDelay
            });

            TestUtil.mockDateNow([ now ]);

            expect(uploadHandler.canEmitNotification(lastNotification)).toBeFalsy();
        });
    })
})