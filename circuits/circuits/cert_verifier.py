import json
from subprocess import check_output
import codecs
import sys
#pass the passport json filepath as passportJson to python function
def main(passportJson):
    f = open(passportJson, "r")
    data = json.load(f)[0]
    modulus = hex(int(data["modulus"]))[2:].upper()

    #verify that the CSCA and DS certificates share the same modulus, ie are chained
    decrypted_CSCA = codecs.decode(check_output(['openssl', 'x509', '-modulus', '-noout', '-in', '../inputs/certificates/CSCA_Certificate.crt']))[8:-2]
    decrypted_DS = codecs.decode(check_output(['openssl', 'x509', '-modulus', '-noout', '-in', '../inputs/certificates/DS_Certificate.crt']))[8:-2]
    if decrypted_CSCA != decrypted_DS or decrypted_DS != modulus:
        raise Exception("F Certificates do not match")

#To run this:
#   String[] command = {"python", "cert_verifier.py", "passport data filepath",}; 
#   Process p = Runtime.getRuntime().exec(command); 
main(sys.argv[1])

#If you want to test, just run this in the terminal: 
#   python3 cert_verifier.py ../inputs/passport_verification/public_key.json
#note that the argument is the passport data filepath.
