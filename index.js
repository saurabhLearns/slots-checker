/*
 * Created on Sat May 08 2021
 *
 * Created by saurabh619@outlook.com
 */

// Whaaaat I've DONEE!:
// 1. Run the cronJob to call API at each minute
// 2. check for the slots available
// 3. If slots are available and mailSentTime is before than 3 hours from current time (which will be, initially)
//    send the mail, and set the mailSentTime to current
// 4. At next API call at next minute, it will check for mailSentTime is before than 3 hours, which will be true, 
//    and it wont send the mail this time, till next 3 hours.

const { CronJob } = require('cron');
const http = require('http');
const moment = require('moment');
const NodeMailer = require('nodemailer');
const request = require('request');

// Helper flag to pause sending mail for few hours, after mail is sent
var mailSentTime = new Date().valueOf() - 3*3600*1000;

/**
 * Initialize http server
 */
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

/**
 * Cron to call the CoWIN API and fetch the API data
 */
const APICron = () => new CronJob('*/2 * * * *', () => {
  const options = {
    url: `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin`,
    method: 'GET',
    qs: {
    	pincode: process.env.PINCODE,
    	date: moment(new Date()).format('DD-MM-YYYY'),
    },
    headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36" }
  };
  makeRequest(options).then(success => {
    if (new Date().valueOf() > mailSentTime + 3*3600*1000) {
      console.log('success!', new Date());
      checkAvailability(success.centers);
    }
  }).catch(err => {
    console.error("ERROR ==> ", err);
  });
}, null, true, 'Asia/Kolkata');

/**
 * Checks for the slots availablity in the data fetched from CoWIN api.
 * @param {array} data centers array from CoWIN api response
 */
const checkAvailability = (data) => {
  let centers = data.map(center => {
    return { ...center, sessions: center.sessions.filter(session => session.min_age_limit === 18 && session.available_capacity > 0)}
  });
  centers = centers.filter(center => center.sessions && center.sessions.length);
  let output = centers.map(center => {
    return ({
      center_name: center.name,
      slots: center.sessions.map(session => {
        return ({
          date: session.date,
          available_bookings: session.available_capacity,
          vaccine: session.vaccine,
        });
      })
    });
  });
  // if theres any slots available, call the function to send the mail
  output.length ? sendMail(output) : null;
}

/**
 * Sends the mail of available slots in table.
 * @param {array} centers array of objects with details of vaccination center details
 */
const sendMail = (centers) => {
  var transporter = NodeMailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: process.env.SMTP_PORT,
    auth: { 
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  // convert data in html table format for clean visualization, I'm a backend dev. I dont know HTML/CSS more that this :P
  let htmlStyle = '<style>.tg  {border-collapse:collapse;border-spacing:0;text-align:center;}.tg td{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;overflow:hidden;padding:10px 5px;word-break:normal;text-align:center;}.tg th{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal;text-align:center;}.tg .tg-0pky{border-color:inherit;vertical-align:top;text-align:center;}</style>';
  let htmlString = `<table class='tg'><tr><th>Centers</th><th>Slot Date </th><th> Remaining </th><th> Vaccine </th></tr>`;
  centers.forEach(center => {
    let toConcat = `<tr><th rowspan='${center.slots.length}'> ${center.center_name}</td>`;
    center.slots.forEach(slot => {
      toConcat = toConcat + `<td> ${slot.date} </td> <td> ${slot.available_bookings} </td> <td> ${slot.vaccine} </td> </tr>`;
      toConcat = toConcat + '<tr>';
    });
    toConcat = toConcat + "</tr>";
    htmlString = htmlString + toConcat;
  });
  htmlString = htmlString + "</table>";
  htmlStyle = htmlStyle + htmlString;
  var mailOptions = {
    to: process.env.RECEIVER_EMAILS,
    from: process.env.EMAIL_ID,
    subject: 'You got vaccine to take!',
    html: htmlStyle,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error in sending email: ',error);
    } else {
      console.log('Email sent: ' + info.response);
      mailSentTime = new Date().valueOf();
    }
  });
}

/**
 * request handler function to call third party apis
 * @param {*} options 
 * @returns Promise
 */
const makeRequest = (options) => new Promise((resolve, reject) => {
  request(options, (err, response, body) => {
    if (err) {
      return reject({success: false, result: null, message: err, statuscode: 500});
    }
    if (response && response.statusCode > 299) {
      return reject(body);
    }
    return resolve(typeof body === 'string' ? JSON.parse(body) : body);
  });
});

server.listen(process.env.PORT || 5000);
APICron();