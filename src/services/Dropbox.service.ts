import { Injectable } from "@nestjs/common";
import { Dropbox, DropboxAuth } from "dropbox";

@Injectable()
export class DropboxService {
  private dbxAuth: DropboxAuth;
  private dbx: Dropbox;
  private accessToken: string;
  private refreshToken: string;

  constructor() {
    this.accessToken =
      "sl.Bv-E_guOgtiQn6FLji8xFpO73nVz9krnIfrSnW5OU2hS3Qlw3vzExkPZlbkIgDRH8lLDILFp-6X3ptcMVr4096ED0pmPH7cP-02p9DCe0I1lvQ9MqiLdUxk8ToTl48Kpdg8sx01tEjO1WTRYoPw5";
    this.refreshToken =
      "QydSschJ_vMAAAAAAAAAAUH0fIuNzZ9ExG5TwzqHpa4bgiAUcJkXCf9ouONt5bSE";
    this.dbx = new Dropbox({
      clientId: "rnxlin8iqwjihu7",
      clientSecret: "drq6feze89b0j33",
      refreshToken:
        "QydSschJ_vMAAAAAAAAAAUH0fIuNzZ9ExG5TwzqHpa4bgiAUcJkXCf9ouONt5bSE",
    });
    this.dbxAuth = new DropboxAuth({
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    });
  }

  async isFileUploaded(fileName: string): Promise<boolean> {
    try {
      const response = await this.dbx.filesListFolder({ path: '' }); 
      const fileExists = response.result.entries.some((entry) => entry.name === fileName);
      return fileExists; 
    } catch (error) {
      return false; 
    }
  }
  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    const CHUNK_SIZE = 16 * 1024 * 1024; // 8MB
    const fileSize = fileBuffer.length;

    try {
      if (fileSize <= CHUNK_SIZE) {
        const response = await this.dbx.filesUpload({
          path: "/" + new Date().toISOString() + fileName,
          contents: fileBuffer,
        });

        const shareLink = await this.dbx.sharingCreateSharedLinkWithSettings({
          path: response.result.path_lower,
          settings: { requested_visibility: { ".tag": "public" } },
        });

        return shareLink.result.url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
      } else {
        let sessionId = await this.startUploadSession(fileBuffer.slice(0, CHUNK_SIZE));

        let promises = [];
        let offset = CHUNK_SIZE;
        while (offset < fileSize) {
          const chunk = fileBuffer.slice(offset, offset + CHUNK_SIZE);
          promises.push(this.appendUploadSession(sessionId, chunk, offset));
          offset += CHUNK_SIZE;
        }

        await Promise.all(promises);

        const resultUrl = await this.finishUploadSession(sessionId, fileBuffer.slice(offset - CHUNK_SIZE), fileName);
        return resultUrl;
      }
    } catch (error) {
      console.error("Error uploading file to Dropbox", error);
      throw new Error("Unable to upload file to Dropbox");
    }
  }

  async startUploadSession(firstChunk: Buffer): Promise<string> {
    const response = await this.dbx.filesUploadSessionStart({
      close: false,
      contents: firstChunk,
    });
    return response.result.session_id;
  }

  async appendUploadSession(sessionId: string, chunk: Buffer, offset: number): Promise<void> {
    await this.dbx.filesUploadSessionAppendV2({
      cursor: {
        session_id: sessionId,
        offset: offset,
      },
      contents: chunk,
    });
  }

  async finishUploadSession(sessionId: string, lastChunk: Buffer, fileName: string): Promise<string> {
    const response = await this.dbx.filesUploadSessionFinish({
      cursor: {
        session_id: sessionId,
        offset: lastChunk.length,
      },
      commit: {
        path: `/${fileName}`,
        mode: { ".tag": "add" },
        autorename: true,
      },
      contents: lastChunk,
    });

    const shareLink = await this.dbx.sharingCreateSharedLinkWithSettings({
      path: response.result.path_lower,
      settings: {
        requested_visibility: { ".tag": "public" },
      },
    });

    return shareLink.result.url.replace(
        "www.dropbox.com",
        "dl.dropboxusercontent.com"
    );
  }
}