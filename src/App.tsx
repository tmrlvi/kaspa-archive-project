import { useState } from 'react'
import reactLogo from './assets/react.svg'

import { Title, Group, Text, Progress, useMantineTheme, Timeline, Space, Code, Anchor } from '@mantine/core';
import { IconUpload, IconFolder, IconX, IconCheck } from '@tabler/icons';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { showNotification } from '@mantine/notifications';
import { Prism } from '@mantine/prism';

import { S3Client, PutObjectCommand, ListObjectsCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { CognitoIdentityClient, GetIdCommandOutput } from "@aws-sdk/client-cognito-identity";

import './App.css'


function UploadDetails() {
}

function App() {
  const theme = useMantineTheme();
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [date, time] = (new Date()).toISOString().split("T")

  function send(file: File) {
    const creds = fromCognitoIdentityPool({
                    client: new CognitoIdentityClient({region: 'eu-west-1'}),
                    identityPoolId: 'eu-west-1:4bec0bcf-1962-43cc-8375-0d6b96b1b4cd'
                  })

    const s3 = new S3Client({
      region: 'eu-west-1',
      credentials: creds
    });

    s3.config.credentials().then((creds: any) => {

      const uploadParams = {
        Bucket: 'kaspa-datadir-submitted',
        Key: `${date}/${creds["identityId"]}/${time}_${file.name}`,
        Body: file,
      }
      //return s3.send(new PutObjectCommand(uploadParams))
      console.log(file);
      const upload = new Upload({
        client: s3, 
        queueSize: 4, // optional concurrency configuration
        //partSize: "5MB", // optional size of each part
        leavePartsOnError: false, // optional manually handle dropped parts
        params: uploadParams,
      });

      upload.on("httpUploadProgress", (progress) => {
        console.log(progress);
        if (progress.loaded !== undefined && progress.total !== undefined) {
          setProgress(100*progress.loaded / progress.total);
        }
      });

      return upload.done();
    }).then((data) => {
          showNotification({
            title: "Upload successful",
            color: "green",
            message: `Successfully uploaded ${file.name} to the storage`,
            icon: <IconCheck/>,
            autoClose: false
          });
          console.log(data);
    }).catch((error) => {
        showNotification({
          title: "Upload faild",
          color: "red",
          message: `Failed uploadig ${file.name} to the storage: ${error}`,
          icon: <IconX/>,
          autoClose: false
        });
      console.log(error);
    })
    .finally(() => {
      setIsLoading(false);
    });
  }


  //const ctx = useDropzoneContext();
  console.log(progress);
  return (
    <div className="App">
      <Title order={1}>Kaspa Archive Project</Title>
      <Text italic>
        This is a placeholder site for <Text weight={700} component="span">Kaspa Archive Project</Text>.
      </Text>
      <Text italic>
        In the future, we will post here out completion status, and you could follow in realtime.
        For now, you can upload your compressed datadir below.
      </Text>
      <Space h="md" />
      <Dropzone
        onDrop={(files) => {
          setIsLoading(true);
          send(files[0]);
          console.log('accepted files', files);
        }}
        onReject={(files) => {
          console.log('rejected files', files)
          showNotification({
            title: "Files rejected",
            color: "red",
            message: `You can only upload a single file each time for now. Please compress and try again.`,
            icon: <IconX/>,
            autoClose: false
          });     
        }}
        loading={isLoading}
        maxFiles={1}
        multiple={false}
      >
        <Group position="center" spacing="xl" style={{ minHeight: 220, pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload
              size={50}
              stroke={1.5}
              color={theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6]}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              size={50}
              stroke={1.5}
              color={theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFolder size={50} stroke={1.5} />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Drag you compressed datadir here
            </Text>
          </div>
        </Group>
      </Dropzone>
      <Progress value={progress}/>
      <Space h="md" />
      <Text align="left">
      <Title order={3}>Direct Upload</Title>
      To upload your datadir directly using <Anchor href="https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"><Code>aws cli</Code></Anchor>, run the following snippet in your shell, with the path to your compressed datadir instead of <Code>`&lt;datadir&gt;`</Code>.
      <Prism language="bash">{
        `aws configure set aws_access_key_id AKIA3SC2F53XHCIMJB4U --profile kaspaarchive
aws configure set aws_secret_access_key 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 --profile kaspaarchive
aws configure set region eu-west-1 --profile kaspaarchive
aws s3 cp <datadir> s3://kaspa-datadir-submitted/${date}/Manual/ --profile kaspaarchive`
      }</Prism>
      </Text>
      <Space h="md" />
      <Title order={2}>Planned</Title>
      <Timeline active={0}>
        <Timeline.Item title="Basic datadirs sharing">
          <Text color="dimmed" size="sm">You can now share your compressed datadirs easily.</Text>
        </Timeline.Item>
        <Timeline.Item title="Provide completion status">
          <Text color="dimmed" size="sm">We will have a bar showing which parts are missing and where.</Text>
        </Timeline.Item>
        <Timeline.Item title="Better datadir sharing">
          <Text color="dimmed" size="sm">
              Allow uploading datadirs directly, and several simulatanously. 
              Allow users to add comments to datadirs
          </Text>
        </Timeline.Item>
        <Timeline.Item title="Uploaders Hall of Fame">
          <Text color="dimmed" size="sm">Uploaders will get a special recognition in this page</Text>
        </Timeline.Item>
        <Timeline.Item title="Automatic upload handling">
          <Text color="dimmed" size="sm">Handle datadirs uploading and update the progress automatically</Text>
        </Timeline.Item>
      </Timeline>
    </div>
  )
}

export default App
