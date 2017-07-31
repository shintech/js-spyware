import execa from 'execa'
import fs from 'fs'
import readLine from 'readline'
import path from 'path'
import bashrcConfig from './random-ps1/index'
var defaultRC = path.join('/etc', 'skel', '.bashrc')
var softwareJSON = require(path.join(path.dirname(__dirname), 'software.json'))
var repoJSON = require(path.join(path.dirname(__dirname), 'repos.json'))

const HOME = process.env['HOME']
const EMAIL = process.argv[3]
const PWD = process.argv[2]
var software = ''

var options = {
  HOME: HOME,
  EMAIL: EMAIL,
  PWD: PWD // PRESENT WORKING DIRECTORY
}

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
  var repoList = []
  var softwareList = []

  switch (parseInt(answer)) {
    case 1:
      // software = softwareJSON['server']
      software = 'server'
      break
    case 2:
      // software = softwareJSON['desktop']
      software = 'desktop'
      break
    case 3:
      // software = softwareJSON['rpi']
      software = 'rpi'
      break
    default:
      software = null
  }

  if (software !== null) {
    let repos = repoJSON[software]
    software = softwareJSON[software]

    for (var i = 0; i < repos.length; i++) {
      repoList += repos[i] + ' '
    }

    for (var j = 0; j < software.length; j++) {
      softwareList += software[j] + ' '
    }

    var obj = {
      software: softwareList,
      repos: repoList
    }

    return obj
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
  execa.shell(`sudo apt-add-repository ${list.repos} && sudo apt-get update && sudo apt-get install ${list.software} -y`).stdout.pipe(process.stdout)
}

getSoftwarePreference(function (list) {
  rsaConfig()
  installSoftware(list)
  bashrcConfig(defaultRC, options)
})
