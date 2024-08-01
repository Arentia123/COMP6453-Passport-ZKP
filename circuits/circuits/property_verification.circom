pragma circom 2.0.0;

template PropertyVerification() {
    // Inputs related to passport
    signal input dobYear;       // Year of birth
    signal input dobMonth;      // Month of birth
    signal input dobDay;        // Day of birth
    signal input currentYear;   // Current year
    signal input currentMonth;  // Current month
    signal input currentDay;    // Current day
    // @audit might want to consider that the MRZ is in bytes and has the nationality
    // in ASCII (3 field elements) - you could do a direct comparison for the bytes
    // to the ASCII representation of the allowedNationality to check nationality
    // instead of relying on an external trusted source to maintain a mapping
    // from numbers to country codes
    signal input nationality;   // Nationality code (e.g., 1 for USA)

    // Inputs related to property
    // @audit the property stuff isn't strictly necessary, could remove
    signal input propertyId;       // ID or unique identifier of the property
    signal input propertyType;     // Type of property (e.g., 1 for residential, 2 for commercial)
    signal input requiredAge;      // Minimum age required to own this property
    signal input allowedNationality; // Allowed nationality for owning this property

    // Constants
    // @audit where are these used? const int does not exist in circom, only var
    // const int MIN_AGE = 18;         // Default minimum age
    // const int USA_NATIONALITY_CODE = 1; // Example code for USA

    // Calculate age
    signal age;            // Age in years
    signal isValidAge;     // Whether the age is valid (>= MIN_AGE)
    signal isValidNationality; // Whether the nationality is valid (USA)
    signal isEligibleForProperty; // Whether the person is eligible for the property

    // Constraints for age calculation
    // @audit this could underflow such age would be huge, either explicitly 
    // check that currentYear >= dobYear or comment that this is assumed
    age <== currentYear - dobYear; // Approximate age calculation

    // Adjust age if the birthday hasn't occurred yet this year
    signal ageAdjustment;
    ageAdjustment <== 0;
    // @audit there are no conditionals in circom (at least over signals)
    // you would have to calculate all these conditionals using comparators
    // from circomlib, then multiply them in a way such that 1 gets added only
    // if either or both of the conditionals below are satisfied
    // this seems complicated, so you might want to consider dealing with unix
    // timestamps instead for simplicity, though that comes with the limitation that we can 
    // only deal with times that are after 1970
    // e.g. (need to npm install circomlib)
    // include "circomlib/circuits/comparators.circom";
    // currMonthLtDobMonth <== LessThan(n)([currentMonth, dobMonth]);
    // currMonthEqDobMonth <== Equal(n)([currentMonth, dobMonth]);
    // currDayLtDobDay <== LessThan(n)([currentDay, dobDay]);
    // <constrain ageAdjustment to be 1 if currMonthLtDobMonth or (currMonthEqDobMonth and currDayLtDobDay)>
    //if (currentMonth < dobMonth || (currentMonth == dobMonth && currentDay < dobDay)) {
        //ageAdjustment <== 1;
    //}
    // @audit can't reassign a signal in circom, need to create a new one e.g. adjustedAge
    // @audit also same possibility here for underflow if age is 0, not sure what 
    // to do about this
    age <== age - ageAdjustment;

    // Check if age is valid
    // @audit need to use a comparator circuit, same for below
    isValidAge <== (age >= requiredAge);

    // Check if nationality is valid for this property
    isValidNationality <== (nationality == allowedNationality);

    // Check if the person is eligible for the property
    isEligibleForProperty <== isValidAge * isValidNationality;

    // Output signals
    signal output ageVerified;      // Output for age verification
    signal output nationalityVerified; // Output for nationality verification
    signal output propertyVerified;   // Output for property eligibility

    // Output constraints
    ageVerified <== isValidAge;
    nationalityVerified <== isValidNationality;
    propertyVerified <== isEligibleForProperty;
}