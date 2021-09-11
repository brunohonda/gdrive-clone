import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    jest,
    test
} from '@jest/globals'
import fs from 'fs'
import { tmpdir } from 'os';
import { join } from 'path';
import faker from 'faker';
import FormData from 'form-data';

import { logger } from '../../src/logger';
import Routes from './../../src/routes.js';
import TestUtil from '../_util/testUtil.js';

describe('#Routes Integration Test', () => {
    const socketId = faker.datatype.uuid();
    const io = {
        to: (id) => io,
        emit: (event, message) => { }
    }

    let defaultDownloadsFolder = '';

    beforeAll(async () => {
        defaultDownloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), 'downloads-'))
    })

    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation();
    })

    afterAll(async () => {
        await fs.promises.rm(defaultDownloadsFolder, {
            recursive: true
        });
    })

    describe('#Upload files', () => {
        test('should upload file to the folder', async () => {
            const filename = 'file_to_upload.txt';
            const fileStream = fs.createReadStream(`./test/integration/data/${filename}`);
            const response = TestUtil.generateWritableStream();

            const form = new FormData();
            form.append('file', fileStream);

            const params = {
                request: Object.assign(form, {
                    headers: form.getHeaders(),
                    method: 'POST',
                    url: `?socketId=${socketId}`
                }),
                response: Object.assign(response, {
                    setHeader: jest.fn(),
                    writeHead: jest.fn(),
                    end: jest.fn()
                }),
                values: () => Object.values(params)
            }

            const routes = new Routes(defaultDownloadsFolder);
            routes.setSocketInstance(io);

            let files = await fs.promises.readdir(defaultDownloadsFolder);
            expect(files).toEqual([]);

            await routes.handler(...params.values());

            files = await fs.promises.readdir(defaultDownloadsFolder);
            expect(files).toEqual([ filename ]);

            expect(params.response.writeHead).toHaveBeenCalledWith(200);
            expect(params.response.end).toHaveBeenCalledWith(JSON.stringify({ result: 'Files uploaded with success!' }));
        })
    })
})