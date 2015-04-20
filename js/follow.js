/* 
 * 关注功能的具体JS实现
 * 使用LocalStorage将关注信息保存在用户本地
 * 
 */

/*
 * 根据番组名字获取相应的关注状态及条目的class属性代码
 * @method getFollowStatue
 * @para {string} bgmName 番组名字
 * @return {string} class属性代码
 */
function getFollowStatue( bgmName ) {
	var htmlstr;
	if (checkFollow(bgmName)){
		htmlstr = 'class = "followed"';
	} else {
		htmlstr = 'class = "unfollowed"';
	}
	return htmlstr;
}

/*
 * 根据番组名字、关注状态关注/取消关注的文字按钮
 * @method getFollowButton
 * @para {string} bgmName 番组名字
 * @para {string} folStu 从getFollowStatue得到的class属性代码
 * @return {string} 有<td>修饰的文字按钮代码
 */
function getFollowButton( bgmName, folStu ) {
	var html;
	switch ( folStu ) {
		case 'class = "followed"': {
			html = '<td class = "followButton"><div class="unfollow" onclick = "unFollow(\'' + bgmName + '\');">取消关注</div></td>';
			break;
		}
		default: case 'class = "unfollowed"': {
			html = '<td class = "followButton"><div class="tofollow" onclick = "addFollow(\'' + bgmName + '\');">关注</div></td>';
			break;
		}
	}
	return html;
}

/*
 * 添加关注信息
 * @method addFollow
 * @para {string} bgmName 番组名字
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
 * 删除关注信息
 * @method unFollow
 * @para {string} bgmName 番组名字
 * @return {string} HTML代码
 */
function unFollow ( bgmName ) {

	var list = localStorage.getItem('bangumi');
    if (list != null) {
        list = list.split(',');
    }
    list = removeFromArray(bgmName, list);
    if ( list != null) {
    	localStorage.setItem('bangumi',list);
    } else {
    	localStorage.removeItem('bangumi');
    }
    location.reload();

}

/*
 * 根据番组名字获取相应的关注状态
 * @method checkFollow
 * @para {string} bgmName 番组名字
 * @return {bool} 是否已关注
 */
function checkFollow ( bgmName ){
	var storage = localStorage.getItem('bangumi');
	if( storage != null ) {
		var list = storage.split(',');
		return inArray( bgmName, list );
	} else {
		return false;
	}
}

/*
 * 检查数组中是否含有某项
 * @method inArray
 * @para {string} bgmName 番组名字
 * @para {array} list 要检查的数组
 * @return {bool} 是否包含
 */
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
}

/*
 * 删除数组中指定的一项
 * @method removeFromArray
 * @para {string} bgmName 番组名字
 * @para {array} list 要删除的原数组
 * @return {array} 删除后的新数组；或者null，如果原数组仅包含要被删除的一项的话
 */
function removeFromArray( bgmName, list ) {
	var i = 0;
	var newList = new Array();
	for (; i < list.length; i++) {
		if ( bgmName != list[i] ) {
			newList.push(list[i]);
		} else {
			continue;
		}
	}
	if ( newList.length == 0 ) {
		return null;
	} else {
		return newList;
	}
}