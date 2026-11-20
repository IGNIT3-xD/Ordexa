import Multer from 'multer'

export interface IRegisterInput {
    email: string;
    password: string;
    name: string;
    profilePicBuffer?: Buffer;
}

export interface ILoginInput {
    email: string;
    password: string;
}

declare global {
    namespace Express {
        interface Request {
            file?: Multer.File;
            files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
        }
    }
}