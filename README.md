

## Just another vaccination-slots availability checker-and-mailer script.

 Why? Because it was holiday. And I was bored. And I missed the chance to book my slot. Because I forgot to check the slots. And slots got completely booked in overnight!

### What is this actually?
A script that will check for the availability of vaccination slots in your locality (if you are 18-45 of age), at regular intervals, and notifies you about the slots available, by mailing you on the provided emailID. Of course.  

### How do I get set up?

- ``` git clone https://github.com/shurikns/slots-checker```
 - ```npm install```
 - export environment variables. Which one? mentioned below!
 - ``` node index.js ```

### Environment variables to use?
- PORT: Port you want to run your server on
- EMAIL_ID: Email ID from which you want to send the email.
- EMAIL_PASSWORD: Sender email password. (Gmail doesn't work, unfortunately)
- SMTP_SERVER: smtp server host of the sender email.
- SMTP_PORT: smtp server port of the sender email.
- RECEIVER_EMAILS: Notification receiver email. Comma separated, if multiple. (abc@xyz.com,pqr@mno.in)
- PINCODE: Area pincode for which you want to get the slots

### How does it works?
-  Uses public [Co-WIN APIs](https://apisetu.gov.in/public/api/cowin) to check the slots availability.
- Runs basically on cronjobs. Calls the Co-WIN API in particular intervals, checks if it has any slots available or not. 
- If yes, hits up the email to receivers! 
- Starts checking for the slots again after few hours. 

##### (Note: This script does not work on non-indian IPs, as Co-WIN app blocks the requests from non-indian IPs. So I could not find any FREE servers to deploy and run the script. And I cannot pay for the same, I'm poor. Suggestions are welcomed)