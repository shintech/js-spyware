import execa from 'execa'
import fs from 'fs-extra'
import readLine from 'readline'
import path from 'path'
import bashrcConfig from './random-ps1/index'
import logger from 'winston-color'
import chalk from 'chalk'
import getStream from 'get-stream'

const HOME = process.env['HOME']
const EMAIL = process.argv[3]
const PWD = process.argv[2]
const vimrcJSON = require(path.join(PWD, 'vimrc.json'))
var defaultRC = path.join('/etc', 'skel', '.bashrc')
var softwareJSON = require(path.join(path.dirname(__dirname), 'software.json'))
var repoJSON = require(path.join(path.dirname(__dirname), 'repos.json'))
var pkg = require(path.join(PWD, 'package.json'))
var user = process.env['USER']
var uid = process.geteuid(user)
var gid = process.getgid(user)
var software = ''

var options = {
  HOME: HOME,
  EMAIL: EMAIL,
  PWD: PWD, // PRESENT WORKING DIRECTORY,
  logger: logger
}

master(function () {
  logger.info('All done...')
})

function master (cb) {
  getSoftwarePreference(function (list) {
    rsaConfig()
    bashrcConfig(defaultRC, options)
    vimConfig()
    autofsConfig()
    installSoftware(list, cb)
  })
}

function getSoftwarePreference (cb) {
  logger.info(`${chalk.red('Spyware Installer version: ', pkg.version)}`)
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
      software = 'server'
      break
    case 2:
      software = 'desktop'
      break
    case 3:
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
      logger.error(err)
    }
    if (result === undefined) {
      execa.shell(`ssh-keygen -t rsa -b 4096 -f ${HOME}/.ssh/id_rsa.test -C ${EMAIL} -q -N ""`).stdout.pipe(process.stdout)
    } else {
      logger.info('id_rsa was found...')
      logger.info('skipping...')
    }
  })
}

function vimConfig () {
  fs.copy(path.join(PWD, '.vim'), path.join(HOME, '.vim2'), err => {
    if (err) {
      logger.error(err)
    }

    var str = ''

    for (var i = 0; i < vimrcJSON['config'].length; i++) {
      str += vimrcJSON['config'][i] + '\n'
    }
    fs.writeFile(path.join(HOME, '.vimrc'), str)
    logger.info('successfully configured vim...')
  })
}

function autofsConfig () {
  const str = `printf "+dir:/etc/auto.master.d\n+auto.master\n/mnt /etc/auto.sshfs uid=${uid},gid=${gid},--timeout=30,--ghost\n" | sudo tee /home/mike/auto.master.b`
  logger.info('autofs configuration...')
  execa.shell(str).then(() => {
    logger.info('autofs configuration complete...')
  })
  .catch((err) => {
    logger.error(err)
  })
}

function installSoftware (list, cb) {
  var command = `sudo apt-add-repository ${list.repos} && sudo apt-get update && sudo apt-get install ${list.software} -y`
  const stream = execa.shell(command).stdout

  stream.pipe(process.stdout)

  getStream(stream).then(value => {
    cb()
  })
}
