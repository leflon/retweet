# [retweet](https://retweet-nsi.xyz)

This project was made as a school project for the last year of high school (🇫🇷 La Terminale).

## Technologies
This project relies on **MySQL** as database manager and on basic technologies : 
 - `Express` for the web server, with `multer` to handle `multipart/form-data` forms and `cookie-parser` to handle cookies.
 - `googleapis`/`nodemailer` to send automatic mails with a gmail address (serves for account recovery emails).
 - `bcrypt` for password encryption
 - `Pug` for the views and Vanilla `CSS`/`JavaScript` on the Front-End.
 
With some minor other dependencies:
 - `colors` for prettier logs
 - `dotenv` to easily retrieve configuration values.
 - `nodemon` for a slightly better development environment
 
 ## Cookies
 This website uses a single encrypted cookie:
  - `auth`: This cookie keeps the user authenticated between sessions.
  
