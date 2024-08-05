pragma circom 2.1.2;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mux1.circom";
include "./div.circom";

// original algo: https://howardhinnant.github.io/date_algorithms.html#days_from_civil
// assumes the date inputted is a valid date
template DateToTimestamp() {
    // date in yymmdd, as per passport mrz format
    signal input in[6];
    signal output out;
    // max no. of bits for any comparison number
    var n = 16;

    signal date[6];
    for (var i = 0; i < 6; i++) {
        date[i] <== in[i] - 48;
    }

    // convert last two digits of year to actual year
    signal yh <== date[0] * 10 + date[1];
    signal yh_lt_70 <== LessThan(n)([yh, 70]);
    signal y <== Mux1()([1900 + yh, 2000 + yh], yh_lt_70);
    signal m <== date[2] * 10 + date[3];
    signal d <== date[4] * 10 + date[5];

    signal m_lte_2 <== LessEqThan(n)([m, 2]);

    signal era <== Div()([y, 400]);

    signal yoe <== y - m_lte_2 - era * 400;
    signal doy_mux <== Mux1()([m - 3, m + 9], m_lte_2);
    signal doy_div <== Div()([153 * doy_mux + 2, 5]);
    signal yoe_div_4 <== Div()([yoe, 4]);
    signal yoe_div_100 <== Div()([yoe, 100]);
    signal doe <== yoe * 365 + yoe_div_4 - yoe_div_100 + doy_div + d - 1;

    out <== (era * 146097 + doe - 719468) * 3600 * 24;
}