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
    location.reload();
    
}

/*

*/
function checkFollow ( bgmName ){
	var storage = localStorage.getItem('bangumi');
	if( storage != null ) {
		var list = storage.split(',');
		return inArray( bgmName, list );
	} else {
		return false;
	}
};

function inArray( bgmName, list ) {
	if ( list == null ) {
		return false;
	}
	var i = 0;
	for (; i < list.length; i++) {
		if ( bgmName == list[i] ) {
			return true;
		} else {
			continue;
		}
	}
	if ( i == list.length ) {
		return false;
	}
};