//Interface
var Excel = require('exceljs');

//Create a Workbook
var workbook = new Excel.Workbook();

var worksheet =  workbook.addWorksheet('sheet', {
  pageSetup:{paperSize: 9, orientation:'landscape'}
});
worksheet.columns = [
  { header: 'Id', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 32 },
  { header: 'Dob', key: 'DOB', width: 10, outlineLevel: 1 }
];
worksheet.addRow({id: 1, name: 'John Dob', dob: new Date(1970,1,1)});
workbook.xlsx.writeFile('f.xlsx')
.then(function() {
    // done
});