This api was made to serve [Mercadin-sasa](https://github.com/jpmesqdev/mercadin-sasa)

This project use Mysql database with:

* database name: mercadin-sasa
* table: entry

name | data | primary 
------------ | ------------- | -------------
id | INT | YES
product_name | VARCHAR | NO
quantity | INT | NO
created_at | DATE | NO
amount | FLOAT | NO
payment_type | VARCHAR | NO

```sh
yarn install
yarn server
```