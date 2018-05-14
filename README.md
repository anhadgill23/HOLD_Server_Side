# HOLD - Cryptocurrency Portfolio Tracker

### Main Contributers: [Andy Vo](https://github.com/AndyVo1998), [Morgan Yu](https://github.com/Morganyyu), [Alexander Holliday](https://github.com/popnfresh234), [Anhad Gill](https://github.com/anhadgill23)

## Overview

HOLD is a bitcoin and other cryptocurrency portfolio tracker app. It lets users login or register and add the investments they made in different coins. It then tracks the profit/loss since the time of purchase. Users can see the total current value of their investments in USD, analyse how they have diversified the portfolio (remember to not put all the eggs in one basket) and check latest trends and market analysis.

HOLD helps solve the problem of people having to manually do the complex calculations for their investments. It does that for them.

This is the server side code for the app. The client side code is [here](https://github.com/anhadgill23/HOLD_Client_Side).

## Heroku Instructions
* Install heroku CLI `
* Run `heroku create <app_name>`
* Push to heroku `git push heroku master`
* Set heroku ENV varialbe for produciton `heroku config:set ENV=production`
* Run KNEX migrations `heroku knex run migrate:latest`