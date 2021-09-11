import {
    describe,
    test,
    expect,
    jest
} from '@jest/globals'
import UploadHandler from '../../src/uploadHandler.js'
import faker from 'faker';
import TestUtil from '../_util/testUtil.js';

describe('#UploadHandler', () => {
    const socketId = faker.datatype.uuid;
    const io = {
        to: (id) => io,
        emit: (event, message) => { }
    }

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
})