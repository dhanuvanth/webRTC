let localRoom = document.getElementById('localRoom')
let consultRoom = document.getElementById('consultRoom')
let roomID = document.getElementById('roomID')
let goRoom = document.getElementById('goRoom')
let localVideo = document.getElementById('localVideo')
let remoteVideo = document.getElementById('remoteVideo')

let roomNumber,localStream,remoteStream,rtcpeerConnection,isCaller

const iceServices = {
    'iceServices':[
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'}
    ]
}

const streamConstraints = {
    audio: true,
    video: true
}

const socket = io()

goRoom.onclick = () => {
    if (roomID.value === '') {
        
        alert('Please Enter Room ID')

    } else {
        
        roomNumber = roomID.value
        socket.emit('create or join', roomNumber)
        localRoom.style = "display: none;"
        consultRoom.style = "display: block;"

    }
}

socket.on('created', room => {
    console.log('Get user Media on create')
    navigator.mediaDevices.getUserMedia(streamConstraints)
    .then(stream => {
        localStream = stream
        localVideo.srcObject = stream
        isCaller = true
    }).catch(err => {
        console.log('Error ocurred', err)
    })
})

socket.on('joined', room => {
    console.log('Get user Media on join')
    navigator.mediaDevices.getUserMedia(streamConstraints)
    .then(stream => {
        localStream = stream
        localVideo.srcObject = stream
        socket.emit('ready',roomNumber)
    }).catch(err => {
        console.log('Error ocurred', err)
    })
})

socket.on('ready',() => {
    if(isCaller){
        console.log(isCaller)
        rtcpeerConnection = new RTCPeerConnection(iceServices)
        rtcpeerConnection.onicecandidate = onIceCandidate
        rtcpeerConnection.ontrack = onAddStream
        rtcpeerConnection.addTrack(localStream.getTracks()[0],localStream)
        rtcpeerConnection.addTrack(localStream.getTracks()[1],localStream)
        rtcpeerConnection.createOffer()
            .then(sessionDescription => {
                rtcpeerConnection.setLocalDescription(sessionDescription)
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber

                })
            }).catch( err => {
                console.log(err)
            })
    }
})

socket.on('offer',(event) => {
    if(!isCaller){
        console.log('offer sent')
        rtcpeerConnection = new RTCPeerConnection(iceServices)
        rtcpeerConnection.onicecandidate = onIceCandidate
        rtcpeerConnection.ontrack = onAddStream
        rtcpeerConnection.addTrack(localStream.getTracks()[0],localStream)
        rtcpeerConnection.addTrack(localStream.getTracks()[1],localStream)
        rtcpeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        console.log('Answer sending...')
        rtcpeerConnection.createAnswer()
            .then(sessionDescription => {
                rtcpeerConnection.setLocalDescription(sessionDescription)
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber
                })
            }).catch( err => {
                console.log(err)
            })
    }
})

socket.on('answer', (event) => {
    rtcpeerConnection.setRemoteDescription(new RTCSessionDescription(event))
})

socket.on('candidate',event => {
    const candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    })
    rtcpeerConnection.addIceCandidate(candidate)
})

function onAddStream(event){
    remoteVideo.srcObject = event.streams[0]
    remoteStream = event.streams[0]
}

function onIceCandidate(event){
    if(event.candidate){
        console.log('Sending ice candidate...',event.candidate)
        socket.emit('candidate',{
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdfMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}