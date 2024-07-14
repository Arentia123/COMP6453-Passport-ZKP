import { CircuitSignals } from "circomkit";

export type INPUT_SIGNALS = [
    "dg1", "preecontent", "econtent", "pubkey", "sig", "dg1_offset",
    "preecontent_size", "preecontent_offset", "econtent_size", "current_timestamp"
];

export const mockPassportData: CircuitSignals<INPUT_SIGNALS> = {
	"dg1": ["97", "91", "95", "31", "88", "80", "60", "65", "85", "83", "68", "79", "69", "60", "60", "74", "79", "72", "78", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "82", "65", "49", "49", "49", "49", "49", "49", "49", "50", "65", "85", "83", "48", "48", "48", "49", "48", "49", "56", "77", "51", "50", "48", "49", "48", "49", "53", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "60", "48", "54"],
	"preecontent": ["85", "23", "138", "246", "225", "97", "27", "22", "190", "246", "112", "249", "30", "123", "33", "213", "198", "133", "35", "250", "75", "66", "139", "171", "98", "84", "46", "16", "8", "128", "71", "41", "254", "250", "6", "186", "104", "130", "85", "108", "214", "97", "166", "7", "167", "106", "77", "29", "181", "129", "39", "105", "253", "205", "114", "221", "154", "94", "146", "111", "147", "26", "154", "102", "245", "80", "110", "122", "240", "146", "125", "39", "71", "154", "182", "173", "181", "78", "48", "81", "21", "29", "182", "58", "42", "207", "3", "82", "36", "181", "250", "88", "33", "104", "200", "28", "89", "189", "19", "25", "69", "192", "133", "12", "83", "197", "32", "230", "200", "99", "69", "47", "64", "81", "186", "181", "88", "170", "188", "134", "25", "107", "115", "132", "23", "109", "245", "73", "100", "197", "77", "87", "100", "161", "150", "171", "84", "55", "67", "158", "148", "185", "38", "166", "101", "38", "223", "146", "34", "141", "158", "79", "212", "90", "209", "169", "228", "225", "11", "182", "178", "176", "157", "191", "233", "223", "255", "63", "74", "99", "144", "198", "68", "255", "230", "113", "74", "231", "237", "49", "90", "178", "15", "68", "131", "189", "59", "40", "252", "110", "133", "66", "86", "110", "8", "85", "161", "183", "197", "24", "190", "235", "153", "148", "179", "164", "112", "77", "50", "34", "26", "191", "200", "151", "47", "230", "138", "243", "236", "186", "9", "45", "253", "60", "148", "191", "53", "117", "79", "2", "127", "122", "34", "128", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "7", "72"],
	"econtent": ["180", "45", "147", "38", "202", "143", "207", "250", "101", "177", "65", "17", "119", "148", "167", "92", "23", "188", "33", "220", "17", "160", "225", "89", "222", "190", "222", "189", "247", "202", "178", "195", "183", "165", "17", "190", "212", "128", "222", "69", "248", "48", "189", "198", "155", "106", "89", "121", "58", "34", "167", "57", "66", "35", "247", "4", "118", "230", "68", "239", "38", "252", "163", "70", "197", "64", "139", "241", "182", "27", "148", "247", "80", "106", "128", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "2", "80", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
	"sig": ["515193727235278008632340369012151950", "599362091132278899165993314565486199", "827276623737441748627666119183351012", "2636340848296689681233302574819801045", "537749364253785530149053504061206687", "2271592276768108306579808471012773929", "2316925133004401014014511028589863448", "1093269121820892647484145439298403727", "385690801639960053868087938481005232", "1331060475502305723868245933142391626", "544378264780495753196619606879998490", "1352205889362202026520742105393407341", "339724201162618906811327697004193846", "894638858059482694540798061059762062", "60535394400778304849460836782164009", "11896464669360915603825855132106145", "1758091278647356639754109457816581"],
	"pubkey": ["1734470851620791685095232686289188861", "280227419845699272920510480616530217", "868022049844297015694632297345158277", "1717511876887806273161273247486627157", "2566118631716505843596329807977626481", "386400691837027449946885559974187978", "141824620196681130253068211795058265", "1738218809629966200395495661801620107", "1084684734069037870631321114200646691", "795144390628973289447621975798680295", "2199901918545772947469000705992940675", "490901187182257395612537434835366790", "2241101620982290428593778539840671617", "2146315846357915334469377298103413985", "2620784462457619874690015126430827051", "1278721519695231922034618917568698073", "3803344193233976621739487703785074"],
	"dg1_offset": "29",
	"preecontent_size": "256",
	"preecontent_offset": "42",
	"econtent_size": "128",
	"current_timestamp": `${Math.floor(Date.now() / 1000) + 3600 * 12}`,
};
