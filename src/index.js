import execa from 'execa'
import fs from 'fs'
import readLine from 'readline'
import path from 'path'

var json = require(path.join(path.dirname(__dirname), './software.json'))

const HOME = process.env['HOME']
const EMAIL = process.argv[2]
var software = ''

function getSoftwarePreference (cb) {
  const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question('Please choose one:\n1.) Ubuntu Server 16.04\n2.) XUbuntu 16.04\n3.) Raspbian\n*.) Skip\n>>>', answer => {
    rl.close()
    var softwareList = getSoftwareList(answer)
    cb(softwareList)
  })
}

function getSoftwareList (answer) {
  switch (parseInt(answer)) {
    case 1:
      software = json['server']
      break
    case 2:
      software = json['desktop']
      break
    case 3:
      software = json['rpi']
      break
    default:
      software = null
  }

  if (software !== null) {
    var softwareList = []
    for (var i = 0; i < software.length; i++) {
      softwareList += software[i] + ' '
    }
    return softwareList
  }
}

function rsaConfig () {
  fs.stat(`${HOME}/.ssh/id_rsa`, (err, result) => {
    if (err && err.path !== `${HOME}/.ssh/id_rsa`) {
      console.log(err)
    }
    if (result === undefined) {
      execa.shell(`ssh-keygen -t rsa -b 4096 -f ${HOME}/.ssh/id_rsa.test -C ${EMAIL} -q -N ""`).stdout.pipe(process.stdout)
    } else {
      console.log('id_rsa was found...\nskipping...')
    }
  })
}

function installSoftware (list) {
  execa.shell(`sudo apt-get update && sudo apt-get install ${list} -y`).stdout.pipe(process.stdout)
}

getSoftwarePreference(function (list) {
  rsaConfig()
  installSoftware(list)
})
