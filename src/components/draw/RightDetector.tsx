// 랜드마크의 경우 왼손이 right로 처리되고 오른손이 left로 처리됨 사용자 기준이라고 생각함
function isGiyeok(landmarks,handedness) {
    // 기역: 엄지, 검지, 중지만 펴짐
    if(handedness == "Left")
    {return (
        //축 비교
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        //방향비교
        landmarks[8].y > landmarks[6].y&&
        landmarks[4].x > landmarks[3].x &&
        landmarks[12].y < landmarks[10].y&&
        landmarks[16].y < landmarks[14].y&&
        landmarks[20].y < landmarks[18].y
    )}else if(handedness == "Right"){
        return(Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].y > landmarks[6].y&&
        landmarks[4].x < landmarks[3].x &&
        landmarks[12].y < landmarks[10].y&&
        landmarks[16].y < landmarks[14].y&&
        landmarks[20].y < landmarks[18].y)
    }
}
function iskieuk(landmarks,handedness) {
    // 기역: 엄지, 검지, 중지만 펴짐
    if(handedness == "Left")
    {return (
        //축 비교
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[12].x - landmarks[10].x)<Math.abs(landmarks[12].y - landmarks[10].y)&&
        //방향비교
        landmarks[8].y < landmarks[6].y&&
        landmarks[4].x > landmarks[3].x &&
        landmarks[16].y < landmarks[14].y&&
        landmarks[20].y < landmarks[18].y&&
        landmarks[12].y > landmarks[10].y
    )}else if(handedness == "Right"){
        return(Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].y < landmarks[6].y&&
        landmarks[4].x < landmarks[3].x &&
        landmarks[12].y > landmarks[10].y&&
        landmarks[16].y < landmarks[14].y&&
        landmarks[20].y < landmarks[18].y)
    }
}
function isNeun(landmarks,handedness) {
    if(handedness == "Left")
    {return (
        Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].x > landmarks[6].x &&
        landmarks[4].y < landmarks[2].y &&
        landmarks[12].x < landmarks[10].x &&
        landmarks[16].x <landmarks[14].x &&
        landmarks[20].x < landmarks[18].x
    )}else if(handedness == "Right"){
        return(
        Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].x < landmarks[6].x &&
        landmarks[4].y < landmarks[2].y &&
        landmarks[12].x > landmarks[10].x &&
        landmarks[16].x >landmarks[14].x &&
        landmarks[20].x > landmarks[18].x
    )
    }
}

function isDegeud(landmarks,handedness) {
    if(handedness == "Left")
    {return (
        (Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x > landmarks[10].x &&
        landmarks[8].x > landmarks[6].x &&
        landmarks[16].x < landmarks[14].x&&
        landmarks[20].x < landmarks[18].x
    )}else if(handedness == "Right"){
        return(
        (Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x < landmarks[10].x &&
        landmarks[8].x < landmarks[6].x &&
        landmarks[16].x > landmarks[14].x&&
        landmarks[20].x > landmarks[18].x
    )
    }
}
function islieul(landmarks,handedness) {
    if(handedness == "Left")
    {return (
        (Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x > landmarks[10].x &&
        landmarks[8].x > landmarks[6].x &&
        landmarks[16].x > landmarks[14].x &&
        landmarks[20].x < landmarks[18].x &&
        Math.abs(landmarks[12].y - landmarks[8].y)<0.115
    )}else if(handedness == "Right"){
        return(
        (Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x < landmarks[10].x &&
        landmarks[8].x < landmarks[6].x &&
        landmarks[16].x < landmarks[14].x&&
        landmarks[20].x > landmarks[18].x&&
        Math.abs(landmarks[12].y - landmarks[8].y)<0.115
    )
    }
}
function istiguet(landmarks,handedness) {
    if(handedness == "Left")
    {return (
        (Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x > landmarks[10].x &&
        landmarks[8].x > landmarks[6].x &&
        ((landmarks[16].x > landmarks[14].x)||(landmarks[16].z > landmarks[12].z))&&
        landmarks[20].x < landmarks[18].x &&
        Math.abs(landmarks[12].y - landmarks[8].y)>0.13
    )}else if(handedness == "Right"){
        return(
        (Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x < landmarks[10].x &&
        landmarks[8].x < landmarks[6].x &&
        landmarks[16].x < landmarks[14].x&&
        landmarks[20].x > landmarks[18].x&&
        Math.abs(landmarks[12].y - landmarks[8].y)>0.13
    )
    }
}
function isbieup(landmarks,handedness) {
    if(handedness == "Left")
    {return (
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[20].y < landmarks[18].y &&
        landmarks[16].y < landmarks[14].y &&
        landmarks[12].y < landmarks[10].y &&
        landmarks[8].y < landmarks[6].y &&
        landmarks[4].x < landmarks[3].x 
    )}else if(handedness == "Right"){
        return (
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[20].y < landmarks[18].y &&
        landmarks[16].y < landmarks[14].y &&
        landmarks[12].y < landmarks[10].y &&
        landmarks[8].y < landmarks[6].y &&
        landmarks[4].x > landmarks[3].x 
        )
    }
}
function isieung(landmarks,handedness) {
    if(handedness == "Left")
    {return (
        Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[12].x - landmarks[10].x)<Math.abs(landmarks[12].y - landmarks[10].y)&&
        landmarks[20].y < landmarks[18].y &&
        landmarks[16].y < landmarks[14].y &&
        landmarks[12].y < landmarks[10].y &&
        landmarks[8].y > landmarks[6].y &&
        landmarks[4].y < landmarks[3].y 
    )}else if(handedness == "Right"){
        return (
        Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[12].x - landmarks[10].x)<Math.abs(landmarks[12].y - landmarks[10].y)&&
        landmarks[20].y < landmarks[18].y &&
        landmarks[16].y < landmarks[14].y &&
        landmarks[12].y < landmarks[10].y &&
        landmarks[8].y > landmarks[6].y &&
        landmarks[4].y < landmarks[3].y 
    )}
}
function issiot(landmarks,handedness){
    if(handedness == "Left")
    {return(
    (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||(landmarks[4].z>landmarks[9].z))&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[12].y > landmarks[10].y &&
    landmarks[8].y > landmarks[6].y &&
    landmarks[4].x < landmarks[3].x &&
    landmarks[16].y < landmarks[14].y &&
    landmarks[20].y < landmarks[18].y &&
    Math.abs(landmarks[12].x - landmarks[8].x)>0.1
    )}else if(handedness == "Right"){
        return(
        (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||(landmarks[4].z>landmarks[9].z))&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].y > landmarks[10].y &&
        landmarks[8].y > landmarks[6].y &&
        landmarks[4].x > landmarks[3].x &&
        landmarks[16].y < landmarks[14].y &&
        landmarks[20].y < landmarks[18].y &&
        Math.abs(landmarks[12].x - landmarks[8].x)>0.1
    )
    }
}
function iszieut(landmarks,handedness){
    if(handedness == "Left")
    {return(
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[16].y < landmarks[14].y &&
    landmarks[12].y > landmarks[10].y &&
    landmarks[8].y > landmarks[6].y &&
    landmarks[20].y < landmarks[18].y &&
    landmarks[4].x > landmarks[3].x &&
    Math.abs(landmarks[12].x - landmarks[8].x)>0.15
    )}else if(handedness == "Right"){
        return(
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].y > landmarks[10].y &&
        landmarks[8].y > landmarks[6].y &&
        landmarks[4].x < landmarks[3].x &&
        landmarks[16].y < landmarks[14].y &&
        landmarks[20].y < landmarks[18].y &&
        Math.abs(landmarks[12].x - landmarks[8].x)>0.13
    )
    }
}
function ischieut(landmarks,handedness){
    if(handedness == "Left")
    {return(
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[12].y > landmarks[10].y &&
    landmarks[8].y > landmarks[6].y &&
    landmarks[20].y < landmarks[18].y &&
    landmarks[4].x > landmarks[3].x 
    )}else if(handedness == "Right"){
        return(
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].y > landmarks[10].y &&
        landmarks[8].y > landmarks[6].y &&
        landmarks[4].x < landmarks[3].x &&
        landmarks[16].y > landmarks[14].y &&
        landmarks[20].y < landmarks[18].y 
    )
    }
}
function ismieum(landmarks,handedness){
    if(handedness == "Left")
    {return(
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[4].z <landmarks[9].z &&
        landmarks[8].z<landmarks[6].z&&
        landmarks[12].z<landmarks[10].z&&
        landmarks[16].z>landmarks[14].z&&
        landmarks[20].z>landmarks[18].z &&
        landmarks[4].x > landmarks[16].x &&
        Math.abs(landmarks[4].y - landmarks[12].y)>0.1
    )}else if(handedness == "Right")
    {return(
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[4].z <landmarks[9].z &&
        landmarks[8].z<landmarks[6].z&&
        landmarks[12].z<landmarks[10].z&&
        landmarks[16].z>landmarks[14].z&&
        landmarks[20].z>landmarks[18].z &&
        landmarks[4].x < landmarks[16].x &&
        Math.abs(landmarks[4].y - landmarks[12].y)>0.1
    )}
}
function ispieup(landmarks,handedness){
    if(handedness == "Left")
    {return(
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].z<landmarks[6].z&&
        landmarks[12].z<landmarks[10].z&&
        landmarks[16].z<landmarks[14].z&&
        landmarks[20].z<landmarks[18].z&&
        Math.abs(landmarks[4].y - landmarks[16].y)>0.1
    )}else if(handedness == "Right")
    {return(
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].z<landmarks[6].z&&
        landmarks[12].z<landmarks[10].z&&
        landmarks[16].z<landmarks[14].z&&
        landmarks[20].z<landmarks[18].z&&
        Math.abs(landmarks[4].y - landmarks[16].y)>0.1
    )}
}
function ishieut(landmarks,handedness){
    if(handedness == "Left")
    {return(
        Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
        landmarks[4].y<landmarks[3].y&&
        landmarks[4].y<landmarks[8].y&&
        landmarks[8].z>landmarks[6].z&&
        landmarks[12].z>landmarks[10].z&&
        landmarks[16].z>landmarks[14].z&&
        landmarks[20].z>landmarks[18].z
    )}else if(handedness == "Right")
    {return(
        Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
        landmarks[4].y<landmarks[3].y&&
        landmarks[4].y<landmarks[8].y&&
        landmarks[8].z>landmarks[6].z&&
        landmarks[12].z>landmarks[10].z&&
        landmarks[16].z>landmarks[14].z&&
        landmarks[20].z>landmarks[18].z
    )}
}
function isa(landmarks,handedness){
    if(handedness == "Left")
    {return(
    landmarks[2].x>landmarks[17].x&&
    // Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    landmarks[4].x<landmarks[2].x&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y < landmarks[12].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[20].y > landmarks[18].y &&
    landmarks[0].x < landmarks[5].x
    )}else if(handedness == "Right"){
    return(landmarks[2].x<landmarks[17].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y < landmarks[12].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[20].y > landmarks[18].y &&
    landmarks[0].x > landmarks[5].x)
    }
}
function isya(landmarks,handedness){
    if(handedness == "Left")
    {return(
    landmarks[2].x>landmarks[17].x&&
    // Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    landmarks[4].x<landmarks[2].x&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y > landmarks[12].y&&
    landmarks[20].y > landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x < landmarks[5].x
    )}else if(handedness == "Right"){
    return(landmarks[2].x<landmarks[17].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y > landmarks[12].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[20].y > landmarks[18].y &&
    landmarks[0].x > landmarks[5].x)
    }
}
function iseo(landmarks,handedness){
    if(handedness == "Left")
    {return(
    landmarks[2].x>landmarks[17].x&&
    // Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    landmarks[4].x<landmarks[2].x&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y < landmarks[12].y&&
    landmarks[20].y > landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x > landmarks[5].x
    )}else if( handedness == "Right"){
    return(landmarks[2].x<landmarks[17].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y < landmarks[12].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[20].y > landmarks[18].y &&
    landmarks[0].x < landmarks[5].x)
    }
}
function isyeo(landmarks,handedness){
    if(handedness == "Left")
    {return(
    landmarks[2].x>landmarks[17].x&&
    // Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    landmarks[4].x<landmarks[2].x&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y > landmarks[12].y&&
    landmarks[20].y > landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x > landmarks[5].x
    )}else if( handedness == "Right"){
    return(landmarks[2].x<landmarks[17].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y > landmarks[12].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[20].y > landmarks[18].y &&
    landmarks[0].x < landmarks[5].x)
    }
}
function isu(landmarks,handedness){
    if(handedness == "Left")
    {return(
    (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y > landmarks[6].y&&
    landmarks[10].y > landmarks[12].y&&
    landmarks[16].y < landmarks[14].y &&
    landmarks[20].y < landmarks[18].y
    )}else if(handedness == "Right"){
    return(
        (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].y > landmarks[6].y&&
        landmarks[10].y > landmarks[12].y&&
        landmarks[16].y < landmarks[14].y &&
        landmarks[20].y < landmarks[18].y
        )
    }
}
function isyu(landmarks,handedness){
    if(handedness == "Left")
    {return(
    (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y > landmarks[6].y&&
    landmarks[16].y < landmarks[14].y &&
    landmarks[10].y < landmarks[12].y &&
    landmarks[20].y < landmarks[18].y
    )}else if(handedness == "Right"){
    return(
        (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].y > landmarks[6].y&&
        landmarks[16].y < landmarks[14].y &&
        landmarks[10].y < landmarks[12].y &&
        landmarks[20].y < landmarks[18].y
        )
    }
}
function iseu(landmarks,handedness){
    if(handedness == "Left")
    {return(
        (Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x < landmarks[10].x &&
        landmarks[8].x > landmarks[6].x &&
        landmarks[20].x < landmarks[18].x &&
        landmarks[16].x < landmarks[14].x
    )}else if(handedness == "Right"){
        return(
        (Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x > landmarks[10].x &&
        landmarks[8].x < landmarks[6].x &&
        landmarks[20].x > landmarks[18].x &&
        landmarks[16].x > landmarks[14].x
        )
    }
}
function iso(landmarks,handedness){
    if(handedness == "Left")
    {return(
    landmarks[2].x<landmarks[17].x&&
    (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y < landmarks[12].y&&
    landmarks[20].y > landmarks[18].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x > landmarks[5].x
    )}else if(handedness == "Right")
    {return(
    landmarks[2].x>landmarks[17].x&&
    (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y < landmarks[12].y&&
    landmarks[20].y > landmarks[18].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x < landmarks[5].x
    )}
}
function isyo(landmarks,handedness){
    if(handedness == "Left")
    {return(
    landmarks[2].x<landmarks[17].x&&
    (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y > landmarks[12].y&&
    landmarks[20].y > landmarks[18].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x > landmarks[5].x
    )}else if(handedness == "Right")
    {return(
    landmarks[2].x>landmarks[17].x&&
    (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y > landmarks[12].y&&
    landmarks[20].y > landmarks[18].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x < landmarks[5].x
    )}
}
function isi(landmarks,handedness){
    if(handedness == "Left")
    {return(
    landmarks[2].x>landmarks[17].x&&
    // Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    landmarks[4].x<landmarks[2].x&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y > landmarks[6].y&&
    landmarks[12].y > landmarks[10].y&&
    landmarks[20].y < landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x < landmarks[5].x
    )}else if(handedness == "Right")
    {return(
    landmarks[2].x<landmarks[17].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y > landmarks[6].y&&
    landmarks[12].y > landmarks[10].y&&
    landmarks[20].y < landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x > landmarks[5].x
    )}
}
function isai(landmarks,handedness){
    if(handedness == "Left")
    {return(
    landmarks[2].x>landmarks[17].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[12].y > landmarks[10].y&&
    landmarks[20].y < landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x < landmarks[5].x
    )}else if(handedness == "Right"){
    return(
        landmarks[2].x<landmarks[17].x&&
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].y < landmarks[6].y&&
        landmarks[12].y > landmarks[10].y&&
        landmarks[20].y < landmarks[18].y &&
        landmarks[16].y > landmarks[14].y &&
        landmarks[0].x > landmarks[5].x
    )
    }
}
function isye(landmarks,handedness){
    if(handedness == "Left")
    {return(
    landmarks[2].x>landmarks[17].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[12].y < landmarks[10].y&&
    landmarks[20].y < landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x < landmarks[5].x
    )}else if(handedness == "Right"){
    return(
        landmarks[2].x<landmarks[17].x&&
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].y < landmarks[6].y&&
        landmarks[12].y < landmarks[10].y&&
        landmarks[20].y < landmarks[18].y &&
        landmarks[16].y > landmarks[14].y &&
        landmarks[0].x > landmarks[5].x
    )
    }
}
function ise(landmarks,handedness){
    if(handedness == "Left")
    {return(
    landmarks[2].x>landmarks[17].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[12].y > landmarks[10].y&&
    landmarks[20].y < landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x > landmarks[5].x
    )}else if(handedness == "Right"){
    return(
        landmarks[2].x<landmarks[17].x&&
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].y < landmarks[6].y&&
        landmarks[12].y > landmarks[10].y&&
        landmarks[20].y < landmarks[18].y &&
        landmarks[16].y > landmarks[14].y &&
        landmarks[0].x < landmarks[5].x
    )
    }
}
function isyeoi(landmarks,handedness){
    if(handedness == "Left")
    {return(
    landmarks[2].x>landmarks[17].x&&
    Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[12].y < landmarks[10].y&&
    landmarks[20].y < landmarks[18].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[0].x > landmarks[5].x
    )}else if(handedness == "Right"){
    return(
        landmarks[2].x<landmarks[17].x&&
        Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].y < landmarks[6].y&&
        landmarks[12].y < landmarks[10].y&&
        landmarks[20].y < landmarks[18].y &&
        landmarks[16].y > landmarks[14].y &&
        landmarks[0].x < landmarks[5].x
    )
    }
}
function iseui(landmarks,handedness){
    if(handedness == "Left")
    {return(
        (Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x < landmarks[10].x &&
        landmarks[8].x > landmarks[6].x &&
        landmarks[16].x < landmarks[14].x &&
        landmarks[20].x > landmarks[18].x 
    )}else if(handedness == "Right")
    {return(
        (Math.abs(landmarks[4].x - landmarks[3].x)>Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
        Math.abs(landmarks[8].x - landmarks[6].x)>Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[12].x > landmarks[10].x &&
        landmarks[8].x < landmarks[6].x &&
        landmarks[16].x > landmarks[14].x &&
        landmarks[20].x < landmarks[18].x 
    )}
}
function isoi(landmarks,handedness){
    if(handedness == "Left")
    {return(
    landmarks[2].x<landmarks[17].x&&
    (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y < landmarks[12].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[20].y < landmarks[18].y&&
    landmarks[0].x > landmarks[5].x
    )}else if(handedness == "Right")
    {return(
    landmarks[2].x>landmarks[17].x&&
    (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y < landmarks[6].y&&
    landmarks[10].y < landmarks[12].y&&
    landmarks[16].y > landmarks[14].y &&
    landmarks[20].y < landmarks[18].y&&
    landmarks[0].x < landmarks[5].x
    
    )}
}
function isui(landmarks,handedness){
    if(handedness == "Left")
    {return(
    (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
    Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
    landmarks[8].y > landmarks[6].y&&
    landmarks[10].y > landmarks[12].y&&
    landmarks[16].y < landmarks[14].y &&
    landmarks[20].y > landmarks[18].y
    )}else if(handedness == "Right"){
        return(
        (Math.abs(landmarks[4].x - landmarks[3].x)<Math.abs(landmarks[4].y - landmarks[3].y)||landmarks[4].z>landmarks[9].z)&&
        Math.abs(landmarks[8].x - landmarks[6].x)<Math.abs(landmarks[8].y - landmarks[6].y)&&
        landmarks[8].y > landmarks[6].y&&
        landmarks[10].y > landmarks[12].y&&
        landmarks[16].y < landmarks[14].y &&
        landmarks[20].y > landmarks[18].y
        )
    }
}
export function detectGesture(landmarks,handedness) {
    if (isGiyeok(landmarks,handedness)) return 'ㄱ';
    if (isbieup(landmarks,handedness)) return 'ㅂ';
    if (isNeun(landmarks,handedness)) return 'ㄴ';
    if (isDegeud(landmarks,handedness)) return 'ㄷ';
    if (islieul(landmarks,handedness)) return 'ㄹ';
    if (isieung(landmarks,handedness)) return 'ㅇ';
    if (issiot(landmarks,handedness)) return 'ㅅ';
    if (iszieut(landmarks,handedness)) return 'ㅈ';
    if (ischieut(landmarks,handedness)) return 'ㅊ';
    if (iskieuk(landmarks,handedness)) return 'ㅋ';
    if (istiguet(landmarks,handedness)) return 'ㅌ';
    if (ismieum(landmarks,handedness)) return 'ㅁ';
    if (ispieup(landmarks,handedness)) return 'ㅍ';
    if (ishieut(landmarks,handedness)) return 'ㅎ';
    if (isa(landmarks,handedness)) return 'ㅏ';
    if (isya(landmarks,handedness)) return 'ㅑ';
    if (iseo(landmarks,handedness)) return 'ㅓ';
    if (isyeo(landmarks,handedness)) return 'ㅕ';
    if (isu(landmarks,handedness)) return 'ㅜ';
    if (isyu(landmarks,handedness)) return 'ㅠ';
    if (iseu(landmarks,handedness)) return 'ㅡ';
    if (iso(landmarks,handedness)) return 'ㅗ';
    if (isyo(landmarks,handedness)) return 'ㅛ';
    if (isi(landmarks,handedness)) return 'ㅣ';
    if (isai(landmarks,handedness)) return 'ㅐ';
    if (isye(landmarks,handedness)) return 'ㅒ';
    if (ise(landmarks,handedness)) return 'ㅔ';
    if (isyeoi(landmarks,handedness)) return 'ㅖ';
    if (iseui(landmarks,handedness)) return 'ㅢ';
    if (isoi(landmarks,handedness)) return 'ㅚ';
    if (isui(landmarks,handedness)) return 'ㅟ';
    return null;
}