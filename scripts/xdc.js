// SPDX-License-Identifier: MIT

const fs = require('fs');

const file_name = process.argv[2];
// console.log(`file_name = ${file_name}`);

const input_str = fs.readFileSync(file_name).toString();
// console.log(`input_str = {input_str}`);

var reg = /[xX][dD][cC](?=[0-9a-fA-F]{40})/g;

const output_str = input_str.replace(reg, '0x');
// console.log(`output_str = ${output_str}`);

fs.writeFileSync(file_name, output_str);
