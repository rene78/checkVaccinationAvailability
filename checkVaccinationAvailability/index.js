module.exports = async function (context, myTimer) {
    const fetch = require("isomorphic-fetch");
    const nodemailer = require("nodemailer");
    
    const timeStamp = new Date().toISOString();
    const EMAILHOST = process.env.eMailHost;
    const EMAILUSERNAME = process.env.eMailUserName;
    const EMAILPASSWORD = process.env.eMailPassword;
    const EMAILFROM = process.env.eMailFrom;
    const EMAILTO = process.env.eMailTo;

    if (myTimer.isPastDue) {
        context.log('JavaScript is running late!');
    }
    // context.log('JavaScript timer trigger function ran!', timeStamp);

    const availability = await getAvailability();
    // const mail = await sendMail("Test456");//Test sendMail function

    async function getAvailability() {
        const response = await fetch("https://impfterminradar.de/api/vaccinations/availability", {
            "headers": {
                "accept": "application/json",
                "accept-language": "de,en;q=0.9,es;q=0.8,pt;q=0.7",
                "authorization": "Bearer undefined",
                "content-type": "application/json",
                "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-ms-useragent": "CoronaImpfterminRadarAPI/1.0.0 core-http/1.2.3 OS/Win32",
                "cookie": "__stripe_mid=d5368e5f-75b2-4da7-a8eb-fc6933e54ca108732c; __stripe_sid=f78daf70-231c-4996-b20f-730d76ddd5b96ecf24"
            },
            "referrer": "https://impfterminradar.de/?search=88046&radius=5",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": "[\"impfterminservice_kre88045\",\"impfterminservice_kre88045_biontech\",\"impfterminservice_kre88045_moderna\",\"impfterminservice_kre88045_astra_zeneca\"]",
            "method": "PATCH",
            "mode": "cors"
        });
        const arr = await response.json();
        for (let i = 0; i < arr.length; i++) {
            const slug = arr[i].Slug; //impfterminservice_kre88045 impfterminservice_kre88045_biontech impfterminservice_kre88045_moderna impfterminservice_kre88045_astra_zeneca
            // context.log(slug);
            
            if (slug.search("biontech") != -1 || slug.search("moderna") != -1) {

                const vaccineName = capitalizeFirstLetter(slug.slice(slug.search("88045_") + 6));//Moderna Biontech
                if (arr[i].Available) {
                    context.log(timeStamp + " - Vaccination dates with " + vaccineName + " AVAILABLE! Sending E-Mail...");
                    const email = await sendMail(vaccineName);
                    break;
                }
            }
        }
        context.log(timeStamp + " - NO Vaccination dates available!");

        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
    }

    // Send E-Mail once returned Array is not empty
    async function sendMail(vaccineName) {
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: EMAILHOST,
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: EMAILUSERNAME,// email username
                pass: EMAILPASSWORD // email password
            }
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: EMAILFROM, // sender address
            to: EMAILTO, // list of receivers
            subject: "Impfstofftermin im Impfzentrum FN verfügbar!", // Subject line
            html: "<p>Hallo Papa,<br><br>ein Impftermin mit " + vaccineName + " kann jetzt im Impfzentrum FN beantragt werden.<br>Besuche dazu https://003-iz.impfterminservice.de/impftermine/service?plz=88045 und wähle einen passenden Termin.<br><br>Gruß<br>René</p>", // html body
        });

        context.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    }
};