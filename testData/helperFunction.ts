import { test ,expect,Page} from '@playwright/test';
import * as  userData  from '../testData/UserInfo.json';
//import * as dbQuery  from '../testData/database.utils';
import { executeQuery } from '../testData/database.utils';

class helperFunction {
constructor() {
  //  this.page = page;
  }
 
 async   getTodaysDateString()  {
     const today = new Date(); 
      // Format for SQL (e.g., 'YYYY-MM-DD' - common for MySQL, PostgreSQL)
      const formattedDate = today.toISOString();
      console.log('today',today);
       console.log('todays date ',formattedDate); 
}

 
 async   getTodaysDate(){
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = today.getFullYear();
    return `${month}/${day}/${year}`;
  }

  
}
  export default helperFunction;
