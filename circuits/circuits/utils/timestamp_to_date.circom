pragma circom 2.1.2;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mux1.circom";
include "./div.circom";

template TimestampToDate() {
    var n = 16;

    signal input in;

    signal output year;
    signal output month;
    signal output day;

    signal days <== Div()([in, 3600 * 24]); 
    var z = days + 719468;
    signal era <== Div()([z, 146097]);
    signal doe <== z - era * 146097;
    signal doe_div_1460 <== Div()([doe, 1460]);
    signal doe_div_36524 <== Div()([doe, 36524]);
    signal doe_div_146096 <== Div()([doe, 146096]);
    signal yoe <== Div()([doe - doe_div_1460 + doe_div_36524 - doe_div_146096, 365]);
    signal y <== yoe + era * 400;
    signal yoe_div_4 <== Div()([yoe, 4]);
    signal yoe_div_100 <== Div()([yoe, 100]);
    signal doy <== doe - yoe * 365 - yoe_div_4 + yoe_div_100;
    signal mp <== Div()([5 * doy + 2, 153]);
    signal d_int <== Div()([153 * mp + 2, 5]);
    day <== doy - d_int + 1;
    signal mp_lt_10 <== LessThan(n)([mp, 10]);
    month <== Mux1()([mp - 9, mp + 3], mp_lt_10);
    signal m_lte_2 <== LessEqThan(n)([month, 2]);
    year <== y + m_lte_2;
}