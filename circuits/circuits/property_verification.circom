pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

// we assume that the dates are valid since they would have been derived from 
// the MRZ, which if invalid would have been caught by passport verification
template PropertyVerification() {
    // Inputs related to passport
    signal input dobYear;       // Year of birth
    signal input dobMonth;      // Month of birth
    signal input dobDay;        // Day of birth
    signal input currentYear;   // Current year
    signal input currentMonth;  // Current month
    signal input currentDay;    // Current day
    signal input nationality[3]; // Nationality

    // Inputs related to property
    signal input requiredAge;      // minimum accepted age
    signal input allowedNationality[3]; // Allowed nationality for owning this property

    // Calculate age
    signal age;            // Age in years
    signal isValidAge;     // Whether the age is valid (>= requiredAge)

    // Calculate age
    age <== currentYear - dobYear;

    // Adjust age if the birthday hasn't occurred yet this year
    signal currMonthLtDobMonth <== LessThan(4)([currentMonth, dobMonth]);
    signal currMonthEqDobMonth <== IsEqual()([currentMonth, dobMonth]);
    signal currDayLtDobDay <== LessThan(5)([currentDay, dobDay]);
    
    signal birthdayNotYetThisYear <== currMonthLtDobMonth + 
                              (currMonthEqDobMonth * currDayLtDobDay);

    signal adjustedAge <== age - birthdayNotYetThisYear;

    // Check if age is valid
    isValidAge <== GreaterEqThan(8)([adjustedAge, requiredAge]);
    isValidAge === 1;

    // Check if nationality is valid
    for (var i = 0; i < 3; i++) {
        nationality[i] === allowedNationality[i];
    }
}

