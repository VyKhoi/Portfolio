pipeline {
    agent any

    environment {
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        DOCKER_IMAGE_PREFIX = 'portfolio-'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test Backend') {
            steps {
                sh 'dotnet build src/Services/Identity.Service/Identity.Service.sln'
                sh 'dotnet build src/Services/Content.Service/Content.Service.sln'
                // TODO: Add dotnet test commands
            }
        }

        stage('Build Frontend') {
            steps {
                dir('src/Web/frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    sh 'docker compose build'
                }
            }
        }

        stage('Deploy locally') {
            steps {
                sh 'docker compose up -d'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Build and Deployment Successful!'
        }
        failure {
            echo 'Pipeline failed. Check logs.'
        }
    }
}
