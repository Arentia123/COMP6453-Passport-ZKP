import * as fs from 'fs';
import * as util from 'util';
import { exec } from 'child_process';
const execAsync = util.promisify(exec);

execAsync(`openssl x509 -in CSCA_Certificate.crt -out CSCA_Certificate.pem -outform PEM`);
execAsync(`openssl x509 -in DS_Certificate.crt -out DS_Certificate.pem -outform PEM`);