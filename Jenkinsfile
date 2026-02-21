pipeline {
    agent { label 'teamhub' }
     parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['dev', 'qa', 'prod'],
            description: 'Select environment to deploy'
        )
    }
    environment {
        JOB_NAME= "teamhub"
        DOCKER_USER= "srinivasulu2004"
        BRANCH_NAME = "${params.ENVIRONMENT == 'prod' ? 'master' : params.ENVIRONMENT}"
    }

    stages {
         stage("clean workspace") {
            steps {
                cleanWs()
            }
        }
        stage('Clone Repository') {
            steps {
                git branch: "${BRANCH_NAME}", credentialsId: 'github', url: 'https://github.com/priacc-innovations/version-3.4-prod.git'
            }
        }

        stage('Build Docker Image') {
            steps {
               script {
                    withDockerRegistry([ credentialsId: 'dockerhub', url: '' ])  {
                      sh '''
                           sudo docker rmi -f $(docker images -aq) || true
                           sudo docker compose build 
                           sudo docker images
                           sudo docker tag ${JOB_NAME}-backend ${DOCKER_USER}/backend
                           sudo docker tag ${JOB_NAME}-frontend ${DOCKER_USER}/frontend
                                                                                             ## here image name will be    '' <pipeline job name>-<service name which u mentioned in docker-compose.yml> ''
                                                                                             ##  example     "job-backend      latest      f7240d40bf2b   About a minute ago   306MB
                                                                                              ##              job-frontend     latest      d48a810bee41   2 minutes ago        52.9MB
                        '''
                    }
                }
               
            }
        }

        stage('Deployment of Application') {
            steps {
                sh '''
                    docker rm -f $(docker ps -aq) || true
                    docker volume rm -f $(docker volume ls -q) || true
                    docker compose up -d
                '''
            }
        }

        stage('List Containers') {
            steps {
                sh 'docker ps -a'
            }
        }
    }

    post {
        success {
            mail to: 'srininivasulubehara@gmail.com',
                 subject: 'Regarding Pipeline Execution',
                 body: 'This pipeline has built successfully.'
        }

        failure {
            mail to: 'srininivasulubehara@gmail.com',
                 subject: 'Regarding Pipeline Execution',
                 body: 'This pipeline has failed.'
        }
    }
}
