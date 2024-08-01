#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

DIRS = ("keys" "keys/csca" "keys/ds" "certs" "certs/csca" "certs/ds")

# create directories
for dir in $DIRS; do
    if [ ! -d $SCRIPT_DIR/$dir ]; then
        mkdir $SCRIPT_DIR/$dir
    fi
done

if [[ $1 == "gen_privkey" ]]; then
    openssl genrsa -out $SCRIPT_DIR/keys/$2/$3 2048
elif [[ $1 == "gen_csca_cert"]]; then
    openssl req \
        -key $SCRIPT_DIR/keys/csca/$2 \
        -x509 \
        -out $SCRIPT_DIR/certs/csca/$3 \
        -days 3650 \
        -subj "/C=AU/O=GOV/OU=DFAT/OU=APO/CN=Passport Country Signing Authority"
elif [[ $1 == "gen_ds_cert" ]]; then
    openssl req \
        -new \
        -key $SCRIPT_DIR/keys/ds/$2 \
        -out $SCRIPT_DIR/certs/ds/$3 \
        -subj "/C=AU/O=GOV/OU=DFAT/OU=APO/CN=Passport Country Document Signer"
    openssl x509 \
        -req \
        -in $SCRIPT_DIR/certs/ds/$3 \
        -out $SCRIPT_DIR/certs/ds/$3 \
        -CA $SCRIPT_DIR/certs/csca/$4 \
        -CAkey $SCRIPT_DIR/keys/csca/$5 \
        -days 90
elif [[ $1 == "help" ]]; then
    echo "Note: All keys and certificates are stored in the keys and certs directories respectively"
    echo "Usage: gen_privkey <csca | ds> <keyname>"
    echo "Usage: gen_csca_cert <keyname> <certname>"
    echo "Usage: gen_ds_cert <ds_keyname> <ds_certname> <csca_certname> <csca_keyname>"
else
    echo "Invalid command"
fi