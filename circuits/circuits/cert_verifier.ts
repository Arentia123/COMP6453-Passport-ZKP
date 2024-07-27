import * as fs from 'fs';
import * as util from 'util';
import { exec } from 'child_process';
const execAsync = util.promisify(exec);

//Convert .crt certificate file to type .pem for openssl


//Verify the corresponding public key of the certificate used to sign the passport is a valid DS certificate public key
const pubCheck = execAsync('openssl x509 -modulus -noout -in myserver.crt | openssl md5');

//Verify the corresponding public key of the certificate used to sign the DS certificate is a valid CSCA certificate
const DSCheck = execAsync('openssl verify -CAfile CSCA_Certificate.crt -untrusted DS_Certificate.crt');