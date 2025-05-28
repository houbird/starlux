const airports = [
  {
    "region":"Taiwan",
    "location":"Taipei, Taiwan",
    "name":"Taoyuan International Airport",
    "code":"TPE",
    "disabled": false
  },
  {
    "region":"Taiwan",
    "location":"Taichung, Taiwan",
    "name":"Taichung International Airport",
    "code":"RMQ",
    "disabled": false
  },
  {
    "region":"Hong Kong / Macau Area",
    "location":"Hong Kong, Hong Kong",
    "name":"Hong Kong International Airport",
    "code":"HKG",
    "disabled": false
  },
  {
    "region":"Hong Kong / Macau Area",
    "location":"Macau, Macao",
    "name":"Macau International Airport",
    "code":"MFM",
    "disabled": false
  },
  {
    "region":"Northeast Asia",
    "location":"Fukuoka, Japan",
    "name":"Fukuoka Airport",
    "code":"FUK",
    "disabled": false
  },
  {
    "region":"Northeast Asia",
    "location":"Hakodate, Japan",
    "name":"Hakodate Airport",
    "code":"HKD",
    "disabled": false
  },
  {
    "region":"Northeast Asia",
    "location":"Kumamoto, Japan",
    "name":"Kumamoto Airport",
    "code":"KMJ",
    "disabled": false
  },
  {
    "region":"Northeast Asia",
    "location":"Nagoya, Japan",
    "name":"Chubu Centrair International Airport",
    "code":"NGO",
    "disabled": false
  },
  {
    "region":"Northeast Asia",
    "location":"Okinawa, Jaan ",
    "name":"Naha Airport",
    "code":"OKA",
    "disabled": false
  },
  {
    "region":"Northeast Asia",
    "location":"Osaka, Japan",
    "name":"Kansai International Airport",
    "code":"KIX",
    "disabled": false
  },
  {
    "region":"Northeast Asia",
    "location":"Sapporo, Japan",
    "name":"New Chitose Airport",
    "code":"CTS",
    "disabled": false
  },
  {
    "region":"Northeast Asia",
    "location":"Sendai, Japan",
    "name":"Sendai International Airport",
    "code":"SDJ",
    "disabled": false
  },
  {
    "region":"Northeast Asia",
    "location":"Tokyo, Japan",
    "name":"Narita International Airport",
    "code":"NRT",
    "disabled": false
  },
  {
    "region":"Southeast Asia",
    "location":"Angeles, Philippines",
    "name":"Clark International Airport",
    "code":"CRK",
    "disabled": false
  },
  {
    "region":"Southeast Asia",
    "location":"Bangkok, Thailand",
    "name":"Suvarnabhumi International Airport",
    "code":"BKK",
    "disabled": false
  },
  {
    "region":"Southeast Asia",
    "location":"Cebu, Philippines",
    "name":"Mactan - Cebu International Airport",
    "code":"CEB",
    "disabled": false
  },
  {
    "region":"Southeast Asia",
    "location":"Chiang Mai, Thailand",
    "name":"Chiang Mai International Airport",
    "code":"CNX",
    "disabled": false
  },
  {
    "region":"Southeast Asia",
    "location":"Da Nang, Vietnam",
    "name":"Da Nang International Airport",
    "code":"DAD",
    "disabled": false
  },
  {
    "region":"Southeast Asia",
    "location":"Hanoi, Vietnam",
    "name":"Noi Bai International Airport",
    "code":"HAN",
    "disabled": false
  },
  {
    "region":"Southeast Asia",
    "location":"Ho Chi Minh City, Vietnam",
    "name":"Tan Son Nhat International Airport",
    "code":"SGN",
    "disabled": false
  },
  {
    "region":"Southeast Asia",
    "location":"Kuala Lumpur, Malaysia",
    "name":"Kuala Lumpur International Airport",
    "code":"KUL",
    "disabled": false
  },
  {
    "region":"Southeast Asia",
    "location":"Penang, Malaysia",
    "name":"Penang International Airport",
    "code":"PEN",
    "disabled": false
  },
  {
    "region":"Southeast Asia",
    "location":"Phu Quoc Island, Vietnam",
    "name":"Phu Quoc International Airport",
    "code":"PQC",
    "disabled": false
  },
  {
    "region":"Southeast Asia",
    "location":"Singapore, Sigapore ",
    "name":"Changi Airport",
    "code":"SIN",
    "disabled": false
  },
  {
    "region":"North America",
    "location":"Los Angeles, USA",
    "name":"Los Angeles International Airport",
    "code":"LAX",
    "disabled": false
  },
  {
    "region":"North America",
    "location":"San Francisco, USA",
    "name":"San Francisco International Airport",
    "code":"SFO",
    "disabled": false
  },
  {
    "region":"North America",
    "location":"Seattle, USA",
    "name":"Seattle-Tacoma International Airport",
    "code":"SEA",
    "disabled": false
  }
];

const regionStyles = {
  "Taiwan": {
    borderColorClass: "border-region-taiwan",
    flag: "🇹🇼"
  },
  "Hong Kong / Macau Area": {
    borderColorClass: "border-region-hkmo",
    flag: "🇭🇰/🇲🇴"
  },
  "Northeast Asia": {
    borderColorClass: "border-region-neasia",
    flag: "🇯🇵/🇰🇷"
  },
  "Southeast Asia": {
    borderColorClass: "border-region-seasia",
    flag: "🇹🇭/🇻🇳/🇵🇭/🇲🇾/🇸🇬"
  },
  "North America": {
    borderColorClass: "border-region-namerica",
    flag: "🇺🇸/🇨🇦"
  }
};