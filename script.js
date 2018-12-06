
/*
  1. .$eval 比直接 .$快很多 也没有需要延时五秒的问题;
  2. 同一页面中内容可用 promise.all 但 iframe 内外内容不可在同一promise中
  3. 如果直接点击 page.click 不起作用 可尝试用  $eval
 */
const puppeteer = require('puppeteer');
const rp = require('request-promise');
//  代理设置
var globalTunnel = require('global-tunnel-ng');

globalTunnel.initialize({
  host: 'dev-proxy.oa.com',
  port: 8080
});

//  配置
const _config = {
    usr: "gosip8",
    psw: "jidong2018",
    _slowMode: !!process.argv.find(e => e==="--report"), //是否为演示模式
    _Interval: 3000
}

// 等待几秒
const _waitForClickNextPage = page => {
  if (_config._slowMode) {
    return page.waitFor(_config._Interval);
  } else {
    return page
  }
}

puppeteer.launch({
    headless: false,
    slowMo: _config._slowMode ? 50 : 0
}).then(async browser => {

    let pages = await browser.pages()
    let page = pages[0];
    //  https://www.alrajhitadawul.com.sa/RcmClientWeb/customerLoginAction.do

    await page.goto('https://www.alrajhitadawul.com.sa/RcmClientWeb/customerLoginAction.do?reqCode=changeLanguage&lng=EN');
    //  await page.goto('https://www.alrajhitadawul.com.sa/GTrade/trading?NameXsl=LoadPlatform');

    //  await page.waitFor(60000);
    //  切换语言
    await page.$eval('.customLangStyle', el => el.click());
    await page.waitForNavigation();

    console.log('😁 开始登录...');
    await page.waitForSelector('input[name="dynaBean.User"]');
    //  document.querySelector('input[name="dynaBean.User"]')
    await page.$eval('input[name="dynaBean.User"]', ( el, _config ) => { el.value = _config.usr }, _config );
    //  document.querySelector('input[name="dynaBean.Password"]')
    await page.$eval('input[name="dynaBean.Password"]', ( el, _config )  => { el.value = _config.psw }, _config);
    //  document.querySelector('select[name="dynaBean.GoTo"]')
    await page.$eval('select[name="dynaBean.GoTo"]', el => el.value = "TradingPlatform" );
    //  document.querySelector('input[value="LOGIN"]')
    await page.$eval('input[value="LOGIN"]', el => el.click());
    await page.waitForNavigation();
    console.log('✅ 登录成功');

    //  查验证码
    let _codeManage = await rp.post('http://api.kii.io/code_manage')
    console.log(_codeManage);

    await page.waitFor(20000);

    let _codeData = await rp.get('http://api.kii.io/code')
    console.log(_codeData);

    await page.$eval('input[name="dynaBean.SecurityCode"]', el => el.value = "" );
    await page.$eval('input[value="Submit"]', el => el.click());
    await page.waitForNavigation();
    /*
    var exp = new Date();
      exp.setTime(exp.getTime() + 60 * 2000)
    await page.setCookie({
      "value": "0000p0IQVspv_bEWhi2_JSS9m04:-1",
      "expires": exp.toGMTString(),  //  往后十小时
      "domain": "www.alrajhitadawul.com.sa",
      "name": "JSESSIONIDTRADING2A"
    }) */
    //  选对应票
    await Promise.all([
         /* page.$eval('#bookByPrice .gbs-input.float-leading.ui-autocomplete-input', el => {
           el.value = "9505 - ARAB SEA";
           el.blur();
         }), */
        //  document.querySelectorAll('#bookByPrice .gbs-mi.gbs-combo-button-16')[0].click()
        page.$eval('#bookByPrice .gbs-mi.gbs-combo-button-16', el => el.click()),
        //  document.querySelectorAll('ul[role="listbox"]')[1].children[0].children[0].focus()
        page.$$eval('ul[role="listbox"]', els => {
          var evObj = document.createEvent( 'Events' );
              evObj.initEvent( "mouseover", true, false );
          els[1].children[0].children[0].dispatchEvent(evObj);
          els[1].children[0].children[0].click();
        })
    ]).catch(e => console.log(e));
})
