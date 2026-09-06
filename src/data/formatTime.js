export const formatTime = value => value ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + ' KST' : '기록 없음'
