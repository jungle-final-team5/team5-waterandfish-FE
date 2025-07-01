
function isGiyeok(landmarks) {
    // 기역: 엄지, 검지, 중지만 펴짐
    
    return (
        //축 비교
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        //방향비교
        landmarks[8].y > landmarks[6].y&&
        landmarks[4].x > landmarks[3].x &&
        landmarks[12].y < landmarks[10].y&&
        landmarks[16].y < landmarks[14].y&&
        landmarks[20].y < landmarks[18].y
    )
}
function iskieuk(landmarks) {
    // 기역: 엄지, 검지, 중지만 펴짐
    return (
        //축 비교
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[12].x - landmarks[10].x)<Math.abs(landmarks[12].y - landmarks[10].y)&&
        //방향비교
        landmarks[8].y < landmarks[6].y&&
        landmarks[4].x > landmarks[3].x &&
        landmarks[16].y < landmarks[14].y&&
        landmarks[20].y < landmarks[18].y&&
        landmarks[12].y > landmarks[10].y
        
    )
}
function isNeun(landmarks) {
    return (
        Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].x > landmarks[6].x &&
        landmarks[4].y < landmarks[2].y &&
        landmarks[12].x < landmarks[10].x &&
        landmarks[16].x <landmarks[14].x &&
        landmarks[20].x < landmarks[18].x
    )
}

function isDegeud(landmarks) {
    return (
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x > landmarks[10].x &&
        landmarks[8].x > landmarks[6].x &&
        landmarks[16].x < landmarks[14].x&&
        landmarks[20].x < landmarks[18].x
    )
}
function islieul(landmarks) {
    return (
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x > landmarks[10].x &&
        landmarks[8].x > landmarks[6].x &&
        landmarks[16].x > landmarks[14].x &&
        landmarks[20].x < landmarks[18].x &&
        Math.abs(landmarks[12].y - landmarks[8].y)<0.1
    )
}
function istiguet(landmarks) {
    return (
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x > landmarks[10].x &&
        landmarks[8].x > landmarks[6].x &&
        landmarks[16].x > landmarks[14].x&&
        landmarks[20].x < landmarks[18].x &&
        Math.abs(landmarks[12].y - landmarks[8].y)>0.13
    )
}
function isbieup(landmarks) {
    return (
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[20].y < landmarks[18].y &&
        landmarks[16].y < landmarks[14].y &&
        landmarks[12].y < landmarks[10].y &&
        landmarks[8].y < landmarks[6].y &&
        landmarks[4].x < landmarks[3].x 

    )
}
function isieung(landmarks) {
    return (
        Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[12].x - landmarks[10].x)<Math.abs(landmarks[12].y - landmarks[10].y)&&
        landmarks[20].y < landmarks[18].y &&
        landmarks[16].y < landmarks[14].y &&
        landmarks[12].y < landmarks[10].y &&
        landmarks[8].y > landmarks[6].y &&
        landmarks[4].y < landmarks[3].y 

    )
}
function issiot(landmarks){
    return(
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[12].y > landmarks[10].y &&
    landmarks[8].y > landmarks[6].y &&
    landmarks[4].x < landmarks[3].x &&
    landmarks[16].y < landmarks[14].y &&
    landmarks[20].y < landmarks[18].y &&
    Math.abs(landmarks[12].x - landmarks[8].x)>0.15
    )
}
function iszieut(landmarks){
    return(
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[16].y < landmarks[14].y &&
    landmarks[12].y > landmarks[10].y &&
    landmarks[8].y > landmarks[6].y &&
    landmarks[20].y < landmarks[18].y &&
    landmarks[4].x > landmarks[3].x &&
    Math.abs(landmarks[12].x - landmarks[8].x)>0.15
    )
}
function ischieut(landmarks){
    return(
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[12].y > landmarks[10].y &&
    landmarks[8].y > landmarks[6].y &&
    landmarks[20].y < landmarks[18].y &&
    landmarks[4].x > landmarks[3].x 

    )
}
function ismieum(landmarks){
    return(
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].z<landmarks[6].z&&
        landmarks[12].z<landmarks[10].z&&
        landmarks[16].z>landmarks[14].z&&
        landmarks[20].z>landmarks[18].z &&
        Math.abs(landmarks[4].y - landmarks[12].y)>0.1
    )
}
function ispieup(landmarks){
    return(
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].z<landmarks[6].z&&
        landmarks[12].z<landmarks[10].z&&
        landmarks[16].z<landmarks[14].z&&
        landmarks[20].z<landmarks[18].z&&
        Math.abs(landmarks[4].y - landmarks[16].y)>0.1
    )
}
function ishieut(landmarks){
    return(
        Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
        landmarks[4].y<landmarks[3].y&&
        landmarks[4].y<landmarks[8].y&&
        landmarks[8].z>landmarks[6].z&&
        landmarks[12].z>landmarks[10].z&&
        landmarks[16].z>landmarks[14].z&&
        landmarks[20].z>landmarks[18].z
    )
}
function isa(landmarks){
    return(
    landmarks[8].x>landmarks[20].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y < landmarks[12].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[20].y > landmarks[18].y &&
    landmarks[0].x < landmarks[6].x
    )
}
function isya(landmarks){
    return(
    landmarks[8].x>landmarks[20].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y > landmarks[12].y&&
    landmarks[20].y > landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x < landmarks[6].x
    )
}
function iseo(landmarks){
    return(
    landmarks[8].x<landmarks[20].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y < landmarks[12].y&&
    landmarks[20].y > landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x > landmarks[6].x
    )
}
function isyeo(landmarks){
    return(
    landmarks[8].x<landmarks[20].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y > landmarks[12].y&&
    landmarks[20].y > landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x > landmarks[6].x
    )
}
function isu(landmarks){
    return(
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y > landmarks[6].y&&
    landmarks[10].y > landmarks[12].y&&
    landmarks[16].y < landmarks[14].y &&
    landmarks[20].y < landmarks[18].y
    )
}
function isyu(landmarks){
    return(
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y > landmarks[6].y&&
    landmarks[16].y < landmarks[14].y &&
    landmarks[10].y < landmarks[12].y &&
    landmarks[20].y < landmarks[18].y
    )
}
function iseu(landmarks){
    return(
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x < landmarks[10].x &&
        landmarks[8].x > landmarks[6].x &&
        landmarks[20].x < landmarks[18].x &&
        landmarks[16].x < landmarks[14].x
    )
}
function iso(landmarks){
    return(
    landmarks[8].x<landmarks[20].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y < landmarks[12].y&&
    landmarks[20].y > landmarks[18].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x < landmarks[6].x
    
    )
}
function isyo(landmarks){
    return(
    landmarks[8].x<landmarks[20].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y > landmarks[12].y&&
    landmarks[20].y > landmarks[18].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x < landmarks[6].x
    )
}
function isi(landmarks){
    return(
    landmarks[8].x>landmarks[20].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y > landmarks[6].y&&
    landmarks[12].y > landmarks[10].y&&
    landmarks[20].y < landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x < landmarks[6].x
    )
}
function isai(landmarks){
    return(
    landmarks[8].x>landmarks[20].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[12].y > landmarks[10].y&&
    landmarks[20].y < landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x < landmarks[6].x
    )
}
function isye(landmarks){
    return(
    landmarks[8].x>landmarks[20].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[12].y < landmarks[10].y&&
    landmarks[20].y < landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x < landmarks[6].x
    )
}
function ise(landmarks){
    return(
    landmarks[8].x>landmarks[20].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[12].y > landmarks[10].y&&
    landmarks[20].y < landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x > landmarks[6].x
    )
}
function isyeoi(landmarks){
    return(
    landmarks[8].x>landmarks[20].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[12].y < landmarks[10].y&&
    landmarks[20].y < landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x > landmarks[6].x
    )
}
function iseui(landmarks){
    return(
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x < landmarks[10].x &&
        landmarks[8].x > landmarks[6].x &&
        landmarks[16].x < landmarks[14].x &&
        landmarks[20].x > landmarks[18].x 
    )
}
function isoi(landmarks){
    return(
    landmarks[8].x<landmarks[20].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y < landmarks[12].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[20].y < landmarks[18].y&&
    landmarks[0].x < landmarks[6].x
    
    )
}
function isui(landmarks){
    return(
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y > landmarks[6].y&&
    landmarks[10].y > landmarks[12].y&&
    landmarks[16].y < landmarks[14].y &&
    landmarks[20].y > landmarks[18].y
    )
}
export function detectGesture(landmarks) {
    if (isGiyeok(landmarks)) return 'ㄱ';
    if (isbieup(landmarks)) return 'ㅂ';
    if (isNeun(landmarks)) return 'ㄴ';
    if (isDegeud(landmarks)) return 'ㄷ';
    if (islieul(landmarks)) return 'ㄹ';
    if (isieung(landmarks)) return 'ㅇ';
    if (issiot(landmarks)) return 'ㅅ';
    if (iszieut(landmarks)) return 'ㅈ';
    if (ischieut(landmarks)) return 'ㅊ';
    if (iskieuk(landmarks)) return 'ㅋ';
    if (istiguet(landmarks)) return 'ㅌ';
    if (ismieum(landmarks)) return 'ㅁ';
    if (ispieup(landmarks)) return 'ㅍ';
    if (ishieut(landmarks)) return 'ㅎ';
    if (isa(landmarks)) return 'ㅏ';
    if (isya(landmarks)) return 'ㅑ';
    if (iseo(landmarks)) return 'ㅓ';
    if (isyeo(landmarks)) return 'ㅕ';
    if (isu(landmarks)) return 'ㅜ';
    if (isyu(landmarks)) return 'ㅠ';
    if (iseu(landmarks)) return 'ㅡ';
    if (iso(landmarks)) return 'ㅗ';
    if (isyo(landmarks)) return 'ㅛ';
    if (isi(landmarks)) return 'ㅣ';
    if (isai(landmarks)) return 'ㅐ';
    if (isye(landmarks)) return 'ㅒ';
    if (ise(landmarks)) return 'ㅔ';
    if (isyeoi(landmarks)) return 'ㅖ';
    if (iseui(landmarks)) return 'ㅢ';
    if (isoi(landmarks)) return 'ㅚ';
    if (isui(landmarks)) return 'ㅟ';
    return null;
}