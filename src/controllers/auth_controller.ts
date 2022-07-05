import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';
import { SignIn } from "../interfaces/login.interface";
import { connect } from '../database/connection';
import { generateJsonWebToken } from '../lib/generate_jwt';
import { IVerifyUser } from '../interfaces/userdb';



export const login = async ( req: Request, res: Response): Promise<Response> => {

    try {

        const { email, password }: SignIn = req.body;

        const conn = await connect();

        // Check is exists Email on database 
        const [verifyUserdb] = await conn.query<RowDataPacket[0]>('SELECT email, passwordd, email_verified FROM users WHERE email = ?', [email]);

        if(verifyUserdb.length == 0){
            return res.status(401).json({
               
                message: 'Credentials are not registered'
            });
        }

        const verifyUser: IVerifyUser = verifyUserdb[0];

        // Check Email is Verified
        if( !verifyUser.email_verified ){
            resendCodeEmail(verifyUser.email);
            return res.status(401).json({
               
                message: 'Please check your email'
            });
        }

        // Check Password
        if( !await bcrypt.compareSync( password, verifyUser.passwordd )){
            return res.status(401).json({
               
                message: 'email or password incorrect'
            });
        }
        
        const uidPersondb = await conn.query<RowDataPacket[]>('SELECT person_uid as uid FROM users WHERE email = ?', [email]);

        const { uid } = uidPersondb[0][0];

        let token = generateJsonWebToken( uid );

        conn.end();
        
        return res.json({
           
            message: 'Welcome on  projet annuel',
            token: token
        });
        
    } catch (err) {
        return res.status(500).json({
           
            message: err
        });
    }

}

export const renweLogin = async ( req: Request, res: Response ) => {

    try {

        const token = generateJsonWebToken( req.idPerson );

        return res.json({
           
            message: 'Bienvenue sur le reseau social du projet annuel',
            token: token
        }); 
        
    } catch (err) {
        return res.status(500).json({
           
            message: err
        });
    }    

}


const resendCodeEmail = async (email: string): Promise<void> => {

    const conn = await connect();

    var randomNumber = Math.floor(10000 + Math.random() * 90000);

    await conn.query('UPDATE users SET token_temp = ? WHERE email = ?', [ randomNumber, email ]);


    conn.end();

}