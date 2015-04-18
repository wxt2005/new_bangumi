/* 
 * 关注功能的具体JS实现
 * 使用LocalStorage将关注信息保存在用户本地
 * 
 */

/*
 * 
 */
function addFollow( bgmName ) {
    
    var list = localStorage.getItem('bangumi');
    if (list != null) {
        list = list.split(',');
    } else {
        list = new Array();
    }
    list.push(bgmName);
    localStorage.setItem('bangumi',list);
    
}
