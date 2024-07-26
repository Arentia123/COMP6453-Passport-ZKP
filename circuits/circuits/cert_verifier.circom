pragma circom 2.0.0;

//Verifying that the certificates match most recent ones from CSCA.

//Verify the corresponding public key of the certificate used to sign the passport is a valid DS certificate public key
//Verify the corresponding public key of the certificate used to sign the DS certificate is a valid CSCA certificate
//Verify that the public key from CSCA is verifiable by the previous CSCA public key.
